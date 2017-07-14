import { ICalc } from "./interfaces";
import * as _ from "underscore";
import * as _s from "underscore.string";

export class OPMCalc {

    private input: ICalc;

    constructor(input: ICalc) {
        this.input = input;
        //Add predefined prefixes
        var prefixes: string[] = _.pluck(this.input.prefixes, 'prefix');
        if(!this.input.prefixes){this.input.prefixes = []};
        if(!_.contains(prefixes, 'rdf')){
            this.input.prefixes.push({prefix: 'rdf', uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'});
        }
        if(!_.contains(prefixes, 'xsd')){
            this.input.prefixes.push({prefix: 'xsd', uri: 'http://www.w3.org/2001/XMLSchema#'});
        }
        if(!_.contains(prefixes, 'seas')){
            this.input.prefixes.push({prefix: 'seas', uri: 'https://w3id.org/seas/'});
        }
        if(!_.contains(prefixes, 'prov')){
            this.input.prefixes.push({prefix: 'prov', uri: 'http://www.w3.org/ns/prov#'});
        }
        if(!_.contains(prefixes, 'opm')){
            this.input.prefixes.push({prefix: 'opm', uri: 'https://w3id.org/opm#'});
        }
        //Remove backslash at end of hostURI
        this.input.hostURI ? this.input.hostURI.replace(/\/$/, "") : null;
        //datatype defaults to xsd:string
        if(this.input.result){
            this.input.result.datatype = this.input.result.datatype ? this.input.result.datatype : 'xsd:string';
        }
    }

    //Create calculation where it doesn't already exist
    postCalc(): string{
        //Define variables
        var hostURI = this.input.hostURI; //The host URI
        var calc = this.input.result.calc; //The calculation to perform
        var args = this.input.args; //Arguments
        var property = this.input.result.property; //New property
        var resourceURI = this.input.resourceURI; //optional
        var unit = this.input.result.unit;
        var datatype = this.input.result.datatype;
        var resource = !resourceURI ? '?resource' : '<'+resourceURI+'>';
        var prefixes = this.input.prefixes;

        for(var i in args){
            if(!args[i].targetPath){
                //Add '?resource' as target path if none is given
                args[i].targetPath = '?resource';
            }else{
                //Clean target path if given
                var str: string = args[i].targetPath;
                str = _s.clean(str); //Remove unnecessary spaces etc.
                var target = _s.strRightBack(str,'?').replace(/ /g,'').replace('.',''); //Get target variable name
                str = _s.endsWith(str,".") ? str+' ' : str+' . '; //Make sure it ends with a dot and a space
                args[i].targetPath = `${str}?${target} `;
            }
            if(resourceURI){
                //Replace '?resource' with the actual URI if one is defined
                var newResource = `<${resourceURI}>`
                args[i].targetPath = args[i].targetPath.replace('?resource',newResource);
            }
        }
        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }
                      
        q+= 'CONSTRUCT {\n';
        q+= `\t${resource} ${property} ?propertyURI .\n`;
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        q+= '\t?stateURI opm:valueAtState ?res ;\n'
        q+= '\t\tprov:generatedAtTime ?now ;\n'
        q+= `\t\topm:expression "${calc}"^^xsd:string ;\n`;
        q+= '\t\tprov:wasDerivedFrom _:c0 .\n';
        q+= '\t_:c0 a rdf:Seq .\n';

        // Add arguments to wasDerivedFrom sequence
        for(var i in args){
            var _i = Number(i)+1;
            q+= `\t_:c0 rdf:_${_i} ?eval${_i} .\n`;
        }

        // Get data
        q+= `} WHERE {\n`;

        // Get latest evaluation of each argument
        for (var i in args){
            var _i = Number(i)+1;
            q+= `\t#GET LATEST VALUE OF ARGUMENT ${_i}\n`;
            q+= `\t{ SELECT `;
            q+= !resourceURI ? '?resource ' : '';
            q+= `(MAX(?_t${_i}) AS ?t${_i}) WHERE {\n`;
            q+= '\t\tGRAPH ?g {\n';
            q+= `\t\t\t${args[i].targetPath} ${args[i].property}/opm:hasState\n`; 
            q+= `\t\t\t\t[ prov:generatedAtTime  ?_t${_i} ] .\n`;
            q+= '\t\t}\n';
            q+= !resourceURI ? '\t} GROUP BY ?resource }\n' : '';
        }

        // No previous calculations must exist
        q+= '\t#NO PREVIOUS CALCULATIONS MUST EXIST\n';
        q+= '\tMINUS {\n';
        q+= '\t\tGRAPH ?g {\n';
        q+= `\t\t\t${resource} ${property}/opm:hasState\n`
        q+= '\t\t\t\t[ prov:generatedAtTime  ?_tc ] .\n';
        q+= '\t\t}\n';
        q+= '\t}\n';

        // Retrieve data
        q+= `\tGRAPH ?g {\n`
        for (var i in args){
            var _i = Number(i)+1;
            q+= `\t\t#GET ARGUMENT ${_i} DATA\n`
            q+= `\t\t${args[i].targetPath} ${args[i].property}/opm:hasState ?eval${_i} .\n`;
            q+= `\t\t?eval${_i} prov:generatedAtTime ?t${_i} ;\n`;
            q+= `\t\t\topm:valueAtState ?v${_i} .\n`;
            q+= `\t\tBIND(xsd:decimal(strbefore(str(?v${_i}), " ")) AS ?arg${_i})\n`; //NB! might give problems with non-ucum
        }

        //NB! BIND(URI(CONCAT("${hostURI}", "/Property/", STRUUID())) AS ?propertyURI) should work - bug in Stardog
        q+= `\t\t#PERFORM CALCULATION AND SPECIFY UNIT + DATATYPE\n`;
        q+= `\t\tBIND((${calc}) AS ?_res)\n`;
        q+= `\t\tBIND(strdt(concat(str(?_res), " ${unit}"), ${datatype}) AS ?res)\n`;
        q+= `\t\t#GENERATE URIs FOR NEW CLASS INSTANCES\n`;
        q+= `\t\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n`;
        q+= `\t\tBIND(URI(CONCAT("${hostURI}", "/Property/", ?guid)) AS ?propertyURI)\n`;
        q+= `\t\tBIND(URI(CONCAT("${hostURI}", "/State/", ?guid)) AS ?stateURI)\n`;
        q+= `\t\t#GET CURRENT TIME\n`;
        q+= `\t\tBIND(now() AS ?now)\n`;
        q+= '\t}\n';
        q+= '}';

        return q;
    }

    //Update calculation where it already exist but inputs have changed
    putCalc(): string{
        //Define variables
        var hostURI = this.input.hostURI; //The host URI
        var calc = this.input.result.calc; //The calculation to perform
        var args = this.input.args; //Arguments
        var property = this.input.result.property; //New property
        var resourceURI = this.input.resourceURI; //optional
        var unit = this.input.result.unit;
        var datatype = this.input.result.datatype;
        var resource = !resourceURI ? '?resource' : '<'+resourceURI+'>';
        var prefixes = this.input.prefixes;

        for(var i in args){
            if(!args[i].targetPath){
                //Add '?resource' as target path if none is given
                args[i].targetPath = '?resource';
            }else{
                //Clean target path if given
                var str: string = args[i].targetPath;
                str = _s.clean(str); //Remove unnecessary spaces etc.
                var target = _s.strRightBack(str,'?').replace(/ /g,'').replace('.',''); //Get target variable name
                str = _s.endsWith(str,".") ? str+' ' : str+' . '; //Make sure it ends with a dot and a space
                args[i].targetPath = `${str}?${target} `;
            }
            if(resourceURI){
                //Replace '?resource' with the actual URI if one is defined
                var newResource = `<${resourceURI}>`
                args[i].targetPath = args[i].targetPath.replace('?resource',newResource);
            }
        }
        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }

        q+= 'CONSTRUCT {\n';
        q+= `\t${resource} ${property} ?propertyURI .\n`;
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        q+= '\t?stateURI opm:valueAtState ?res ;\n'
        q+= '\t\tprov:generatedAtTime ?now ;\n'
        q+= `\t\topm:expression "${calc}"^^xsd:string ;\n`;
        q+= '\t\tprov:wasDerivedFrom _:c0 .\n';
        q+= '\t_:c0 a rdf:Seq .\n';

        for(var i in args){
            var _i = Number(i)+1;
            q+= `\t_:c0 rdf:_${_i} ?eval${_i} .\n`;
        }

        q+= `} WHERE {\n`;

        //Get latest calculation result
        q+= `\t#GET LATEST CALCULATION RESULT\n`;
        q+= `\t{ SELECT `;
        q+= !resourceURI ? '?resource ' : '';
        q+= `(MAX(?_tc) AS ?tc) WHERE {\n`;
        q+= `\t\tGRAPH ?gi {\n`;
        q+= `\t\t\t${resource} ${property}/opm:hasState\n`;
        q+= `\t\t\t\t[ prov:generatedAtTime  ?_tc ] .\n`;
        q+= '\t\t}\n';
        q+= !resourceURI ? '\t} GROUP BY ?resource }\n' : '';

        // Get latest evaluation of each argument
        for (var i in args){
            var _i = Number(i)+1;
            q+= `\t#GET LATEST VALUE OF ARGUMENT ${_i}\n`;
            q+= `\t{ SELECT `;
            q+= !resourceURI ? '?resource ' : '';
            q+= `(MAX(?_t${_i}) AS ?t${_i}) WHERE {\n`;
            q+= '\t\tGRAPH ?g {\n';
            q+= `\t\t\t${args[i].targetPath} ${args[i].property}/opm:hasState\n`; 
            q+= `\t\t\t\t[ prov:generatedAtTime  ?_t${_i} ] .\n`;
            q+= '\t\t}\n';
            q+= !resourceURI ? '\t} GROUP BY ?resource }\n' : '';
        }

        //Only return if inputs have changed
        q+= `\t#ONLY RETURN IF AN INPUT HAS CHANGED SINCE LAST CALCULATION\n`;
        q+= `\tFILTER(`;
        for (var i in args){
            var _i = Number(i)+1;
            q+= `( ?tc < ?t${_i} )`;
            q+= (_i != args.length) ? ' || ' : ')\n';
        }

        //Get propertyURI
        q+= `\tGRAPH ?gi {\n`;
        q+= `\t\t${resource} ${property} ?propertyURI .\n`;
        q+= '\t}\n';

        //Get argument values
        q+= `\tGRAPH ?g {\n`
        for (var i in args){
            var _i = Number(i)+1;
            q+= `\t\t#GET ARGUMENT ${_i} DATA\n`
            q+= `\t\t${args[i].targetPath} ${args[i].property}/opm:hasState ?eval${_i} .\n`;
            q+= `\t\t?eval${_i} prov:generatedAtTime ?t${_i} ;\n`;
            q+= `\t\t\topm:valueAtState ?v${_i} .\n`;
            q+= `\t\tBIND(xsd:decimal(strbefore(str(?v${_i}), " ")) AS ?arg${_i})\n`; //NB! might give problems with non-ucum
        }

        //NB! BIND(URI(CONCAT("${hostURI}", "/Property/", STRUUID())) AS ?propertyURI) should work - bug in Stardog
        q+= `\t\t#PERFORM CALCULATION AND SPECIFY UNIT + DATATYPE\n`;
        q+= `\t\tBIND((${calc}) AS ?_res)\n`;
        q+= `\t\tBIND(strdt(concat(str(?_res), " ${unit}"), ${datatype}) AS ?res)\n`;
        q+= `\t\t#GENERATE URIs FOR NEW CLASS INSTANCES\n`;
        q+= `\t\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n`;
        q+= `\t\tBIND(URI(CONCAT("${hostURI}", "/State/", ?guid)) AS ?stateURI)\n`;
        q+= `\t\t#GET CURRENT TIME\n`;
        q+= `\t\tBIND(now() AS ?now)\n`;
        q+= '\t}\n';
        q+= '}';

        return q;
    }

    // //Update calculation where an argument has changed
    // putCalc(): string{
    //     //Retrieve and process variables
    //     var hostURI = this.input.hostURI.replace(/\/$/, ""); //The host URI (remove backslash at end)
    //     var calc = this.input.result.calc; //The calculation to perform
    //     var args = this.input.args; //Arguments
    //     var property = this.input.result.property; //New property
    //     var resourceURI = this.input.resourceURI; //optional
    //     var unit = this.input.result.unit;  //optional
    //     var datatype = this.input.result.datatype ? this.input.result.datatype : 'xsd:string';  //optional - defaults to xsd:string
    //     var resource = !resourceURI ? '?resource' : '<'+resourceURI+'>';
    //     var prefixes = this.input.prefixes;

    //     for(var i in args){
    //         if(!args[i].targetPath){
    //             //Add '?resource' as target path if none is given
    //             args[i].targetPath = '?resource';
    //         }else{
    //             //Clean target path if given
    //             var str: string = args[i].targetPath;
    //             str = _s.clean(str); //Remove unnecessary spaces etc.
    //             var target = _s.strRightBack(str,'?').replace(/ /g,'').replace('.',''); //Get target variable name
    //             str = _s.endsWith(str,".") ? str+' ' : str+' . '; //Make sure it ends with a dot and a space
    //             args[i].targetPath = `${str}?${target} `;
    //         }
    //         if(resourceURI){
    //             //Replace '?resource' with the actual URI if one is defined
    //             var newResource = `<${resourceURI}>`
    //             args[i].targetPath = args[i].targetPath.replace('?resource',newResource);
    //         }
    //     }
    //     var q: string = '';
    //     //Define prefixes
    //     for(var i in prefixes){
    //         q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
    //     }
                      
    //     q+= `CONSTRUCT 
    //         {
    //             ?calculatedProperty opm:hasState ?stateURI .
    //             ?stateURI opm:valueAtState ?res ;
    //                             prov:generatedAtTime ?now ;
    //                             opm:expression "${calc}"^^${datatype} ;
    //                             prov:wasDerivedFrom _:c0 .
    //             _:c0 a rdf:Seq . \n`;

    //     for(var i in args){
    //         var _i = Number(i)+1;
    //         q+= `_:c0 rdf:_${_i} ?eval${_i} . \n`;
    //     }

    //     q+= `} WHERE {`;

    //     //Get the time of the latest calculation
    //     q+= `{ SELECT  ?calculatedProperty (MAX(?_tc) AS ?tc)
    //             WHERE
    //                 { GRAPH ?g
    //                     { ?resource ${property}/opm:hasState _:b0 .
    //                     _:b0 ^opm:hasState ?calculatedProperty .
    //                     _:b0  prov:generatedAtTime  ?_tc
    //                     }
    //                 }
    //             GROUP BY ?calculatedProperty
    //          }`;
        
    //     //Get data about calculation
    //     q+= `GRAPH ?gi {
    //             ?calculatedProperty opm:hasState 
    //                                     [ prov:generatedAtTime ?tc ;
    //                                       opm:expression ?calc ;
    //                                       opm:valueAtState ?old_res ;
    //                                       prov:wasDerivedFrom+ [?position ?old_arg] ] .
    //          }`;
        
    //     //Get the time of the latest input values
    //     q+= `{ SELECT  ?old_arg (MAX(?_t) AS ?t)
    //             WHERE
    //                 { GRAPH ?g
    //                     { ?old_arg ^opm:hasState/opm:hasState ?arg .
    //                         ?arg  prov:generatedAtTime  ?_t
    //                     }
    //                 }
    //             GROUP BY ?old_arg
    //          }`;

    //     //Get the values of these arguments
    //     q+= `GRAPH ?g {
    //             ?old_arg ^opm:hasState/opm:hasState ?new_arg .
    //             ?new_arg prov:generatedAtTime  ?t ;
    //                      opm:valueAtState ?new_arg_val ;
    //         }`;

    //     //Should put arguments in separate variables based on list position
    //     //Even possible?

    //     q+= `BIND(str(540) AS ?_res)
    //          BIND(datatype(?old_res) AS ?datatype)
    //          BIND(strafter(str(?old_res), " ") AS ?unit)
    //          BIND(strdt(concat(str(?_res), " ", ?unit), ?datatype) AS ?res)
    //          BIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)
    //          BIND(URI(CONCAT("${hostURI}", "/State/", ?guid)) AS ?stateURI)
    //          BIND(now() AS ?now)`;
    //     q+= `}`

    //     return q;
    // }
    //List outdated calculations
    //Checks either generally or for a specific resource
    //Returns the following:
    listOutdated(): string{
        var prefixes = this.input.prefixes;
        var resourceURI = this.input.resourceURI;
        var evalPath: string = '';
        if(resourceURI){
            evalPath = `<${resourceURI}> ?hasProp ?propertyURI . `;
        }
        var q = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }
        q+= `SELECT ?propertyURI ?calc_time ?arg_last_update ?new_arg ?old_val ?new_val 
             WHERE {`;
        //Get the time of the latest calculation
        //Property has opm:hasState that is derived from something else
        q+= `{ SELECT  ?propertyURI (MAX(?tc) AS ?calc_time)
                WHERE
                    { GRAPH ?gi
                        { ${evalPath}
                          ?propertyURI opm:hasState _:b0 .
                          _:b0 prov:wasDerivedFrom+ [?p ?o] .
                          _:b0 prov:generatedAtTime ?tc .
                        }
                    }
                GROUP BY ?propertyURI
             }`;
        //Get data about calculation
        q+= `GRAPH ?gi
                { ${evalPath}
                  ?propertyURI opm:hasState _:b1 .
                  _:b1 prov:wasDerivedFrom+ [?position ?old_arg] .
                  _:b1 prov:generatedAtTime ?calc_time .
                  _:b1 opm:valueAtState ?old_val .
                }`;
        //Get the time of the latest input values
        q+= `{ SELECT  ?old_arg (MAX(?ta) AS ?arg_last_update)
                WHERE
                    { GRAPH ?g
                        { ?old_arg ^opm:hasState/opm:hasState ?arg .
                          ?arg prov:generatedAtTime ?ta .
                        }
                    }
                GROUP BY ?old_arg
             }`;
        //Get argument values
        q+= `GRAPH ?g
                {
                  ?old_arg ^opm:hasState/opm:hasState ?new_arg .
                  ?new_arg prov:generatedAtTime  ?arg_last_update ;
                           opm:valueAtState ?new_val .
                }`;
        //Filter to only show outdated calculations
        q+= `FILTER(?arg_last_update > ?calc_time) }`;
        
        return q;
    }

}
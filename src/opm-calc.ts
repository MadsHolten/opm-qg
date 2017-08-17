import * as _ from "underscore";
import * as _s from "underscore.string";
import { BaseModel } from "./base";
import { Prefix, Literal, Base } from "./base";

interface GetCalc {
    calculationURI?: string; //to return results only for a specific calculation
    queryType?: string;
}

interface GetFoIProps {
    foiURI?: string;
    queryType?: string;
}

export interface PostCalcData extends Base {
    hostURI: string; //Needed as there is nothing else to extract it from
    expression: string;
    argumentPaths: string[];
    inferredProperty: InferredProperty;
}

export interface PostCalc extends Base {
    calculationURI: string;
    expression: string;
    argumentPaths: string[];
    inferredProperty: string;
    unit?: Literal;     //optional
    foiURI?: string;    //if only applicable to a specific FoI
}

interface InferredProperty {
    propertyURI: string;
    unit?: Literal;
}

export class OPMCalc extends BaseModel {

    listCalculations(input: GetCalc){
        var queryType = input.queryType;
        var prefixes = this.prefixes;

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }
        if(queryType == 'construct'){
            q+= 'CONSTRUCT {\n';
            q+= '\t?calculationURI a ?calcClasses ;\n';
            q+= '\t\tsd:namedGraph ?g ;\n';
            q+= '\t\trdfs:label ?label ;\n';
            q+= '\t\trdfs:comment ?comment .\n';
            q+= '}\n';
        }else{
            q+= 'SELECT ?calculationURI ?label ?comment\n';
        }

        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n';
        q+= '\t\t?calculationURI opm:inferredProperty ?inferredProperty ;\n';
        q+= '\t\t\tprov:generatedAtTime ?timestamp ;\n';
        q+= '\t\tOPTIONAL{ ?arg opm:targetPath ?argTP . }\n';
        q+= '\t\tOPTIONAL{ ?calculationURI a ?calcClasses . }\n';
        q+= '\t\tOPTIONAL{ ?calculationURI rdfs:label ?label . }\n';
        q+= '\t\tOPTIONAL{ ?calculationURI rdfs:comment ?comment . }\n';
        q+= '\t}\n';
        q+= '}';
        return q;
    }

    putOutdated(input: Base): string{
        const graphURI = input.graphURI;

        var q = '';
        //Define prefixes
        q+= 'PREFIX prov: <http://www.w3.org/ns/prov#>\n';
        q+= 'PREFIX opm:  <https://w3id.org/opm#>\n';
        q+= 'PREFIX cdt:  <http://w3id.org/lindt/custom_datatypes#>\n';
        q+= 'CONSTRUCT {\n';
        q+= '\t?calcState a opm:Outdated ;\n';
        q+= '\t\topm:outdatedArgument ?old_arg ;\n';
        q+= '\t\topm:newArgument ?new_arg ;\n';
        q+= '\t\topm:argumentChange ?pct .\n';
        q+= '}\n';
        q+= 'WHERE {\n';
        q+= `\tBIND(<${graphURI}> AS ?gi)`;
        //Get the time of the latest calculation
        //Property has opm:hasState that is derived from something else
        q+= `\t#GET TIME OF LATEST CALCULATION\n`;
        q+= `\t{ SELECT  ?propertyURI (MAX(?tc) AS ?calc_time) WHERE {\n`;
        q+= `\t\tGRAPH ?gi {\n`;
        q+= `\t\t\t?propertyURI opm:hasState/prov:generatedAtTime ?tc .\n`;
        q+= `\t\t}\n`;
        q+= `\t} GROUP BY ?propertyURI }\n`;
        //Get data about calculation
        q+= `\t#GET DATA ABOUT CALCULATION\n`;
        q+= `\tGRAPH ?gi {\n`;
        q+= `\t\t?propertyURI opm:hasState ?calcState .\n`;
        q+= `\t\t?calcState prov:wasDerivedFrom+ ?old_arg ;\n`;
        q+= `\t\t\tprov:generatedAtTime ?calc_time ;\n`;
        q+= `\t\t\topm:valueAtState ?old_res .\n`;
        q+= `\t}\n`;
        //Get the time of the latest input values
        q+= `\t#GET TIME OF LATEST ARGUMENTS\n`;
        q+= `\t{ SELECT  ?old_arg (MAX(?ta) AS ?arg_last_update) WHERE {\n`;
        q+= `\t\tGRAPH ?g {\n`;
        q+= `\t\t\t?arg ^opm:hasState/opm:hasState ?old_arg ;\n`;
        q+= `\t\t\t\tprov:generatedAtTime ?ta .\n`;
        q+= `\t\t}\n`;
        q+= `\t} GROUP BY ?old_arg }\n`;
        //Get argument values
        q+= `\t#GET DATA ABOUT ARGUMENTS\n`;
        q+= `\tGRAPH ?g {\n`;
        q+= `\t\t?old_arg ^opm:hasState/opm:hasState ?new_arg ;\n`;
        q+= `\t\t\topm:valueAtState ?old_val .\n`;
        q+= `\t\t?new_arg prov:generatedAtTime  ?arg_last_update ;\n`;
        q+= `\t\t\topm:valueAtState ?new_val .\n`;
        q+= `\t}\n`;
        //Filter to only show outdated calculations
        q+= `\t#ONLY SHOW OUTDATED\n`;
        q+= `\tFILTER(?arg_last_update > ?calc_time)\n`;
        q+= `\t#CALCULATE ARGUMENT CHANGE PERCENTAGE\n`;
        q+= `\tBIND(xsd:decimal(strbefore(str(?old_val), " ")) AS ?old)\n`;
        q+= `\tBIND(xsd:decimal(strbefore(str(?new_val), " ")) AS ?new)\n`;
        q+= `\tBIND(IF((?old>?new) , ?old , ?new) AS ?max)\n`;
        q+= `\tBIND(IF((?old<?new) , ?old , ?new) AS ?min)\n`;
        q+= `\tBIND(ROUND(((?max-?min)/?max)*100) AS ?change)\n`;
        q+= `\tBIND(strdt(concat(str(?change), " %"), cdt:ucum) AS ?pct)\n`;
        q+= `}`;

        return q;
    }

    getCalcData(input: GetCalc): string{
        var calculationURI = input.calculationURI;
        var queryType = input.queryType;
        var prefixes = this.prefixes;

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }
        if(queryType == 'construct'){
            q+= 'CONSTRUCT {\n';
            q+= '\t?calculationURI a ?calcClasses ;\n';
            q+= '\t\tsd:namedGraph ?g ;\n';
            q+= '\t\topm:inferredProperty ?inferredProperty ;\n';
            q+= '\t\tprov:generatedAtTime ?timestamp ;\n';
            q+= '\t\topm:expression ?expression ;\n';
            q+= '\t\topm:unit ?unit ;\n';
            q+= '\t\trdfs:label ?label ;\n';
            q+= '\t\trdfs:comment ?comment ;\n';
            q+= '\t\topm:argumentPaths ?list .\n';
            q+= '\t?listRest rdf:first ?head ;\n';
            q+= '\t\trdf:rest ?tail .\n';
            q+= '}\n';
        }else{
            q+= 'SELECT ?calculationURI ?label ?comment ?inferredProperty ?timestamp\n';
        }

        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n';
        if(calculationURI){
            q+= `\t\tBIND(<${calculationURI}> AS ?calculationURI)\n`;
        }
        q+= '\t\t?calculationURI opm:inferredProperty ?inferredProperty ;\n';
        q+= '\t\t\tprov:generatedAtTime ?timestamp ;\n';
        q+= '\t\t\topm:expression ?expression ;\n';
        q+= '\t\t\topm:argumentPaths ?list .\n';
        q+= '\t\t?list rdf:rest* ?listRest .\n';
        q+= '\t\t?listRest rdf:first ?head ;\n';
        q+= '\t\t\trdf:rest ?tail .\n';
        q+= '\t\tOPTIONAL{ ?arg opm:targetPath ?argTP . }\n';
        q+= '\t\tOPTIONAL{ ?calculationURI a ?calcClasses . }\n';
        q+= '\t\tOPTIONAL{ ?calculationURI rdfs:label ?label . }\n';
        q+= '\t\tOPTIONAL{ ?calculationURI rdfs:comment ?comment . }\n';
        q+= '\t\tOPTIONAL{ ?calculationURI opm:unit ?unit . }\n';
        q+= '\t}\n';
        q+= '}';
        return q;
    }
    
    postCalcData(input: PostCalcData): string{
        //Define variables
        var label = input.label;
        var comment = input.comment;
        var userURI = input.userURI;
        var hostURI = input.hostURI;
        var expression = input.expression;
        var argumentPaths = input.argumentPaths;
        //Inferred property
        var iProp = input.inferredProperty;
        var iPropURI = iProp.propertyURI;
        var iUnit = iProp.unit.value;
        var iDatatype = iProp.unit.datatype;
        
        //Add prefix(es) to the predefined ones
        var prefixes = this.concatenatePrefixes(input.prefixes);

        //Clean property (add triangle brackets if not prefixes)
        iPropURI = _s.startsWith(iPropURI, 'http') ? `<${iPropURI}>` : `${iPropURI}`;

        //Make sure that argument paths begin with ?foi
        argumentPaths = _.map(argumentPaths, path => {
            var firstSubjectVar = _s.strLeft(_s.strRight(path, '?'), ' ');
            return path.replace('?'+firstSubjectVar, '?foi'); //Replace with ?foi
        })
        
        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }
                      
        q+= 'CONSTRUCT {\n';
        q+= `\t?calculationURI a opm:Calculation ;\n`;
        if(label){
            q+= `\t\trdfs:label "${label}" ;\n`;
        }
        if(comment){
            q+= `\t\trdfs:comment "${comment}" ;\n`;
        }
        if(userURI){
            q+= `\t\tprov:wasAttributedTo <${userURI}> ;\n`;
        }
        q+= '\t\tprov:generatedAtTime ?now ;\n';
        q+= `\t\topm:inferredProperty ${iPropURI} ;\n`;
        q+= `\t\topm:expression "${expression}" ;\n`;
        q+= `\t\topm:unit "${iUnit}"`;
        q+= iDatatype ? `^^${iDatatype} ;\n` : ' ;\n';
        
        /**
         * THE FOLLOWING DOESN'T WORK WITH STARDOG
         */
        // q+= '\t\topm:arguments ( ';

        // // Add arguments to arguments list
        // for(var i in argumentPaths){
        //     q+= `argumentPaths[i]`;
        //     q+= (Number(i) == args.length-1) ? ' ) .\n' : ' ';
        // }

        /**
         * INSTEAD WE WILL HAVE TO NEST THE ARGUMENT LIST
         */
        q+= '\t\topm:argumentPaths [\n';
        _.each(argumentPaths, (obj, i) => {
            q+= '\t\t';
            q+= _s.repeat("  ", i+1); //two spaces
            q+= `rdf:first "${argumentPaths[i]}" ; rdf:rest `;
            q+= (argumentPaths.length == i+1) ? 'rdf:nil\n' : '[\n';
        });
        _.each(argumentPaths, (obj, i) => {
            if(i < argumentPaths.length-1){
                q+= '\t\t';
                q+= _s.repeat("  ", argumentPaths.length-(i+1));
                q+= ']\n';
            }
        });
        q+= '\t\t] .\n';

        q+= '} WHERE {\n';
        q+= `\t#GENERATE URIs FOR NEW CLASS INSTANCE\n`;
        q+= `\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n`;
        q+= '\t#CREATE STATE AND PROPERTY URI´s\n';
        q+= `\tBIND(URI(CONCAT(STR("${hostURI}"), "/Calculation/", ?guid)) AS ?calculationURI)\n`;
        q+= `\t#GET CURRENT TIME\n`;
        q+= `\tBIND(now() AS ?now)\n`;
        q+= '}';

        return q;
    }

    //Create calculation where it doesn't already exist
    postCalc(input: PostCalc): string{
        //Define variables
        var calculationURI = input.calculationURI;
        var expression = input.expression;
        var argumentPaths = input.argumentPaths;
        var argumentVars: string[] = [];
        var iProp = input.inferredProperty;
        var iUnit = input.unit.value;
        var iDatatype = input.unit.datatype;
        //Optional
        var foiURI = input.foiURI; //If only for a specific FoI

        //Add prefix(es) to the predefined ones
        var prefixes = this.concatenatePrefixes(input.prefixes);

        //Clean argument paths and retrieve argument variables
        argumentVars = this.cleanArgPaths(argumentPaths).vars;
        argumentPaths = this.cleanArgPaths(argumentPaths).paths;

        //Clean property (add triangle brackets if not prefixes)
        iProp = _s.startsWith(iProp, 'http') ? `<${iProp}>` : `${iProp}`;

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }
                      
        q+= 'CONSTRUCT {\n';
        q+= `\t?foi ${iProp} ?propertyURI .\n`;
        q+= '\t?propertyURI a opm:Property ;\n';
        q+= '\t\trdfs:label "Derived Property"@en ;\n';
        q+= '\t\topm:hasState ?stateURI .\n';
        q+= '\t?stateURI a opm:State , opm:Derived ;\n';
        q+= '\t\trdfs:label "Derived State"@en ;\n';
        q+= '\t\topm:valueAtState ?res ;\n';
        q+= '\t\tprov:generatedAtTime ?now ;\n';
        q+= `\t\tprov:wasAttributedTo <${calculationURI}> ;\n`;
        q+= '\t\tprov:wasDerivedFrom ';
        for(var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `?state${_i}`
            q+= (argumentPaths.length == _i) ? ' .\n' : ' , ';
        }

        // Get data
        q+= `} WHERE {\n`;
        if(foiURI){
            q+= `BIND(${foiURI} AS ?foi)`;
        }
        // Get latest evaluation of each argument
        for (var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `\t#GET LATEST VALUE OF ARGUMENT ${_i} (var ${argumentVars[i]})\n`;
            q+= `\t{ SELECT ?foi (MAX(?_t${_i}) AS ?t${_i}) WHERE {\n`;
            q+= '\t\tGRAPH ?g {\n';
            q+= `\t\t\t${argumentPaths[i]} .\n`;
            q+= `\t\t\t${argumentVars[i]} opm:hasState ?state .\n`;
            q+= `\t\t\t?state prov:generatedAtTime ?_t${_i} .\n`;
            q+= '\t\t}\n';
            q+= '\t} GROUP BY ?foi }\n';
        }

        // No previous calculations must exist
        q+= '\t#NO PREVIOUS CALCULATIONS MUST EXIST\n';
        q+= '\tMINUS {\n';
        q+= '\t\tGRAPH ?g {\n';
        q+= `\t\t\t?foi ${iProp}/opm:hasState\n`;
        q+= '\t\t\t\t[ prov:generatedAtTime  ?_tc ] .\n';
        q+= '\t\t}\n';
        q+= '\t}\n';

        // Retrieve data
        q+= '\t#GET DATA\n';
        q+= `\tGRAPH ?g {\n`;
        for (var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `\t\t#GET ARGUMENT ${_i} DATA\n`;
            q+= `\t\t${argumentPaths[i]}_ .\n`;
            q+= `\t\t\t${argumentVars[i]}_ opm:hasState ?state${_i} .\n`;
            q+= `\t\t?state${_i} prov:generatedAtTime ?t${_i} ;\n`;
            q+= `\t\t\topm:valueAtState ?v${_i} .\n`;
            q+= `\t\tBIND(xsd:decimal(strbefore(str(?v${_i}), " ")) AS ${argumentVars[i]})\n`; //NB! might give problems with non-ucum
        }

        //NB! BIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/Property/", STRUUID())) AS ?propertyURI) should work - bug in Stardog
        q+= `\t\t#PERFORM CALCULATION AND SPECIFY UNIT + DATATYPE\n`;
        q+= `\t\tBIND((${expression}) AS ?_res)\n`;
        q+= `\t\tBIND(strdt(concat(str(?_res), " ${iUnit}"), ${iDatatype}) AS ?res)\n`;
        q+= `\t\t#GENERATE URIs FOR NEW CLASS INSTANCES\n`;
        q+= `\t\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n`;
        q+= this.getHost(`<${calculationURI}>`);
        q+= '\t\t#CREATE STATE AND PROPERTY URI´s\n';
        q+= '\t\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\t\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/Property/", ?guid)) AS ?propertyURI)\n';
        q+= `\t\t#HOW TO HANDLE VALIDITY?\n`;
        q+= '\t\tBIND(IF(?del, true, false) AS ?del)\n'
        q+= `\t\t#GET CURRENT TIME\n`;
        q+= `\t\tBIND(now() AS ?now)\n`;
        q+= '\t}\n';
        q+= '}';

        return q;
    }

    putCalc(input): string{
        //Define variables
        var calculationURI = input.calculationURI;
        var expression = input.expression;
        var argumentPaths = input.argumentPaths;
        var argumentVars: string[] = [];
        var iProp = input.inferredProperty;
        var iUnit = input.unit.value;
        var iDatatype = input.unit.datatype;
        //Optional
        var foiURI = input.foiURI; //If only for a specific FoI

        //Add prefix(es) to the predefined ones
        var prefixes = this.concatenatePrefixes(input.prefixes);

        //Clean argument paths and retrieve argument variables
        argumentVars = this.cleanArgPaths(argumentPaths).vars;
        argumentPaths = this.cleanArgPaths(argumentPaths).paths;

        //Clean property (add triangle brackets if not prefixes)
        iProp = _s.startsWith(iProp, 'http') ? `<${iProp}>` : `${iProp}`;

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }

        q+= 'CONSTRUCT {\n';
        q+= `\t?foi ${iProp} ?propertyURI .\n`;
        q+= '\t?propertyURI a opm:Property ;\n';
        q+= '\t\trdfs:label "Derived Property"@en ;\n';
        q+= '\t\topm:hasState ?stateURI .\n';
        q+= '\t?stateURI a opm:State , opm:Derived ;\n';
        q+= '\t\trdfs:label "Derived State"@en ;\n';
        q+= '\t\topm:valueAtState ?res ;\n';
        q+= '\t\tprov:generatedAtTime ?now ;\n';
        q+= `\t\topm:expression "${expression}" ;\n`;
        q+= `\t\tprov:wasAttributedTo <${calculationURI}> ;\n`;
        q+= '\t\tprov:wasDerivedFrom ';
        for(var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `?state${_i}`
            q+= (argumentPaths.length == _i) ? ' .\n' : ' , ';
        }

        // Get data
        q+= `} WHERE {\n`;

        //BIND to FoIURI if one is given
        if(foiURI){
            q+= `BIND(${foiURI} AS ?foi)`
        }

        // No previous calculations must exist
        q+= '\t#GET LATEST CALCULATION RESULT\n';
        q+= '\t{ SELECT ?foi (MAX(?_tc) AS ?tc) WHERE {\n';
        q+= '\t\tGRAPH ?gi {\n';
        q+= `\t\t\t?foi ${iProp}/opm:hasState\n`;
        q+= '\t\t\t\t[ prov:generatedAtTime  ?_tc ] .\n';
        q+= '\t\t}\n';
        q+= '\t} GROUP BY ?foi }\n';
        
        // Get latest evaluation of each argument
        for (var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `\t#GET LATEST VALUE OF ARGUMENT ${_i} (var ${argumentVars[i]})\n`;
            q+= `\t{ SELECT ?foi (MAX(?_t${_i}) AS ?t${_i}) WHERE {\n`;
            q+= '\t\tGRAPH ?g {\n';
            q+= `\t\t\t${argumentPaths[i]} .\n`; 
            q+= `\t\t\t${argumentVars[i]} opm:hasState ?state .\n`;
            q+= `\t\t\t?state prov:generatedAtTime ?_t${_i} .\n`;
            q+= '\t\t}\n';
            q+= '\t} GROUP BY ?foi }\n';
        }

        //Only return if inputs have changed
        //NB! Should also update if calculation definition has changed!
        q+= `\t#ONLY RETURN IF AN INPUT HAS CHANGED SINCE LAST CALCULATION\n`;
        q+= `\tFILTER(`;
        for (var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `( ?tc < ?t${_i} )`;
            q+= (_i != argumentPaths.length) ? ' || ' : ')\n';
        }

        //Get propertyURI
        q+= `\tGRAPH ?gi {\n`;
        q+= `\t\t?foi ${iProp} ?propertyURI .\n`;
        q+= '\t}\n';

        //Get argument values
        q+= `\tGRAPH ?g {\n`
        for (var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `\t\t#GET ARGUMENT ${_i} DATA (var ${argumentVars[i]})\n`;
            q+= `\t\t\t${argumentPaths[i]}_ .\n`; 
            q+= `\t\t\t${argumentVars[i]}_ opm:hasState ?state${_i} .\n`;
            q+= `\t\t?state${_i} prov:generatedAtTime ?t${_i} ;\n`;
            q+= `\t\t\topm:valueAtState ?v${_i} .\n`;
            q+= `\t\tBIND(xsd:decimal(strbefore(str(?v${_i}), " ")) AS ${argumentVars[i]})\n`; //NB! might give problems with non-ucum
        }

        //NB! BIND(URI(CONCAT("${hostURI}", "/Property/", STRUUID())) AS ?propertyURI) should work - bug in Stardog
        q+= `\t\t#PERFORM CALCULATION AND SPECIFY UNIT + DATATYPE\n`;
        q+= `\t\tBIND((${expression}) AS ?_res)\n`;
        q+= `\t\tBIND(strdt(concat(str(?_res), " ${iUnit}"), ${iDatatype}) AS ?res)\n`;
        q+= `\t\t#GENERATE URIs FOR NEW CLASS INSTANCES\n`;
        q+= `\t\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n`;
        q+= this.getHost(`<${calculationURI}>`);
        q+= '\t\t#CREATE STATE URI´s\n';
        q+= '\t\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= `\t\t#GET CURRENT TIME\n`;
        q+= `\t\tBIND(now() AS ?now)\n`;
        q+= '\t}\n';
        q+= '}';

        return q;
    }

    checkCircularDependency(): string{
        
        var q = '';
        q+= 'ASK\n';
        q+= 'WHERE {\n'
        
        q+= '}\n'
        return q;
    }

    //Clean argument paths and return the variables used for the arguments
    cleanArgPaths(paths): any{
        var vars: string[] = [];
        //Argument paths should not include space and dot in end
        var paths = _.chain(paths).map(path => {
            //Find the first variable
            var firstVar = '?'+_s.strLeft(_s.strRight(path, '?'), ' ');
            if(firstVar != '?foi'){
                path = path.replace(firstVar, '?foi');
            }
            return path;
        }).map(path => {
            //Find last variable
            var lastVar = '?'+_s.strRightBack(path, '?');

            //remove things after space if any
            if(_s.contains(lastVar, ' ')){
                vars.push(_s.strLeftBack(lastVar, ' '));
                return _s.strLeftBack(path, ' ');
            }
            vars.push(lastVar);
            return path;
        }).value();
        return {paths: paths, vars: vars};
    }

    getHost(someURI): string {
        var q = '';
        q+='\t\t#EXTRACT HOST URI\n';
        q+=`\t\tBIND(IF(CONTAINS(STR(${someURI}), "https://"), "https://", "http://") AS ?http)\n`;
        q+=`\t\tBIND(STRAFTER(STR(${someURI}), STR(?http)) AS ?substr1)\n`;
        q+='\t\tBIND(STRAFTER(STR(?substr1), "/") AS ?substr2)\n';
        q+='\t\tBIND(STRBEFORE(STR(?substr1), "/") AS ?host)\n';
        q+='\t\tBIND(STRBEFORE(STR(?substr2), "/") AS ?db)\n';
        return q;
    }
}
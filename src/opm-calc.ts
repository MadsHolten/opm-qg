import * as _ from "underscore";
import * as _s from "underscore.string";

interface Base {
    label?: string;
    comment?: string;
    userURI?: string;
    prefixes: Prefix[];
}

interface Prefix {
    prefix: string;
    uri: string;
}

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

interface InferredProperty {
    propertyURI: string;
    unit?: Literal;
}

interface Literal {
    value: string;
    datatype?: string;
}

export class OPMCalc {

    private prefixes: Prefix[];
    private queryType: string;

    constructor() {
        //Predefined prefixes
        this.prefixes = [
            {prefix: 'rdf', uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'},
            {prefix: 'xsd', uri: 'http://www.w3.org/2001/XMLSchema#'},
            {prefix: 'prov', uri: 'http://www.w3.org/ns/prov#'},
            {prefix: 'opm', uri: 'https://w3id.org/opm#'},
            {prefix: 'seas', uri: 'https://w3id.org/seas/'},
            {prefix: 'sd', uri: 'http://www.w3.org/ns/sparql-service-description#'}
        ]
    }

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

    //List outdated calculations
    //Checks either generally or for a specific FoI
    //Returns the following:
    listOutdated(input: GetFoIProps): string{
        var foiURI = input.foiURI;
        var queryType = input.queryType;

        var q = '';
        //Define prefixes
        q+= 'PREFIX prov: <http://www.w3.org/ns/prov#>\n';
        q+= 'PREFIX opm: <https://w3id.org/opm#>\n';

        if(queryType == 'construct'){
            q+= 'CONSTRUCT {\n';
            q+= '\t?foi ?hasProp ?propertyURI .\n';
            q+= '\t?propertyURI opm:hasState ?calcState .\n';
            q+= '\t?calcState opm:newArguments _:newArgs ;\n';
            q+= '\t\tprov:wasDerivedFrom _:oldArgs ;\n';
            q+= '\t\tprov:generatedAtTime ?calc_time ;\n';
            q+= '\t\topm:valueAtState ?old_res .\n';
            q+= '\t_:newArgs ?position ?new_arg .\n';
            q+= '\t_:oldArgs ?position ?old_arg .\n';
            q+= '\t?old_arg opm:valueAtState ?old_val .\n';
            q+= '\t?new_arg opm:valueAtState ?new_val .\n';
            q+= '}\n';
        }else{
            q+= 'SELECT ?propertyURI ?calc_time ?arg_last_update ?new_arg ?old_val ?new_val\n';
        }
        
        q+= 'WHERE {\n';
        if(foiURI){
            q+= `\tBIND(<${foiURI}> AS ?foi)\n`;
        }
        //Get the time of the latest calculation
        //Property has opm:hasState that is derived from something else
        q+= `\t#GET TIME OF LATEST CALCULATION\n`;
        q+= `\t{ SELECT  ?propertyURI (MAX(?tc) AS ?calc_time) WHERE {\n`;
        q+= `\t\tGRAPH ?gi {\n`;
        q+= `\t\t\t?foi ?hasProp ?propertyURI .\n`;
        q+= `\t\t\t?propertyURI opm:hasState _:b0 .\n`;
        q+= `\t\t\t_:b0 prov:wasDerivedFrom+ [?p ?o] .\n`;
        q+= `\t\t\t_:b0 prov:generatedAtTime ?tc .\n`;
        q+= `\t\t}\n`;
        q+= `\t} GROUP BY ?propertyURI }\n`;
        //Get data about calculation
        q+= `\t#GET DATA ABOUT CALCULATION\n`;
        q+= `\tGRAPH ?gi {\n`;
        q+= `\t\t?foi ?hasProp ?propertyURI .\n`;
        q+= `\t\t?propertyURI opm:hasState ?calcState .\n`;
        q+= `\t\t?calcState prov:wasDerivedFrom+ [?position ?old_arg] .\n`;
        q+= `\t\t?calcState prov:generatedAtTime ?calc_time .\n`;
        q+= `\t\t?calcState opm:valueAtState ?old_res .\n`;
        q+= `\t}\n`;
        //Get the time of the latest input values
        q+= `\t#GET TIME OF LATEST ARGUMENTS\n`;
        q+= `\t{ SELECT  ?old_arg (MAX(?ta) AS ?arg_last_update) WHERE {\n`;
        q+= `\t\tGRAPH ?g {\n`;
        q+= `\t\t\t?old_arg ^opm:hasState/opm:hasState ?arg .\n`;
        q+= `\t\t\t?arg prov:generatedAtTime ?ta .\n`;
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
        var prefixes = this.prefixes;
        var hostURI = input.hostURI;
        var expression = input.expression;
        var argumentPaths = input.argumentPaths;
        //Inferred property
        var iProp = input.inferredProperty;
        var iPropURI = iProp.propertyURI;
        var iUnit = iProp.unit.value;
        var iDatatype = iProp.unit.datatype;
        
        //Add prefix(es) to the predefined ones
        if(input.prefixes){
            _.each(input.prefixes, obj => {
                return prefixes.push(obj);
            })
        }

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
        })
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

    checkCircularDependency(): string{
        
        var q = '';
        q+= 'ASK\n';
        q+= 'WHERE {\n'
        
        q+= '}\n'
        return q;
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
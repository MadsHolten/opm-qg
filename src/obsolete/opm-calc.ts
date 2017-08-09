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

interface GetCalcData {
    calculationURI?: string; //to return results only for a specific calculation
}

interface PostCalcData extends Base {
    hostURI: string; //Needed as there is nothing else to extract it from
    expression: string;
    argumentPaths: string[];
    inferredProperty: string;
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

    getCalcData(input: GetCalcData): string{
        var calculationURI = input.calculationURI;
        var prefixes = this.prefixes;

        calculationURI = 'https://localhost/opm/Calculation/87745f16-2592-4bac-850f-30488357185f';

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }
        if(this.queryType == 'construct'){
            q+= 'CONSTRUCT {\n';
            q+= '\t?calculationURI a ?calcClasses ;\n';
            q+= '\t\tsd:namedGraph ?g ;\n';
            q+= '\t\topm:inferredProperty ?inferredProperty ;\n';
            q+= '\t\tprov:generatedAtTime ?timestamp ;\n';
            q+= '\t\topm:expression ?expression ;\n';
            q+= '\t\topm:arguments [ ?pos ?arg ] ;\n';
            q+= '\t\topm:unit ?unit ;\n';
            q+= '\t\trdfs:label ?label ;\n';
            q+= '\t\trdfs:comment ?comment .\n';
            q+= '\t?arg opm:property ?argProp ;\n';
            q+= '\t\topm:targetPath ?argTP .\n';
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
        q+= '\t\t\topm:arguments [ ?pos ?arg ] .\n';
        q+= '\t\t?arg opm:property ?argProp .\n';
        q+= '\t\tOPTIONAL{ ?arg opm:targetPath ?argTP . }\n';
        q+= '\t\tOPTIONAL{ ?calculationURI a ?calcClasses . }\n';
        q+= '\t\tOPTIONAL{ ?calculationURI rdfs:label ?label . }\n';
        q+= '\t\tOPTIONAL{ ?calculationURI rdfs:comment ?comment . }\n';
        q+= '\t\tOPTIONAL{ ?calculationURI opm:unit ?unit . }\n';
        q+= '\t}\n';
        q+= '}';
        return q;
    }

    //List outdated calculations
    //Checks either generally or for a specific FoI
    //Returns the following:
    listOutdated(): string{
        var foiURI = this.input ? this.input.foiURI : undefined;
        var evalPath: string = '';
        if(foiURI){
            evalPath = `<${foiURI}> ?hasProp ?propertyURI . `;
        }
        var q = '';
        //Define prefixes
        q+= 'PREFIX prov: <http://www.w3.org/ns/prov#>\n';
        q+= 'PREFIX opm: <https://w3id.org/opm#>\n';

        if(this.queryType == 'construct'){
            q+= 'CONSTRUCT {\n';
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
        //Get the time of the latest calculation
        //Property has opm:hasState that is derived from something else
        q+= `\t#GET TIME OF LATEST CALCULATION\n`;
        q+= `\t{ SELECT  ?propertyURI (MAX(?tc) AS ?calc_time) WHERE {\n`;
        q+= `\t\tGRAPH ?gi {\n`;
        q+= `\t\t\t${evalPath}\n`;
        q+= `\t\t\t?propertyURI opm:hasState _:b0 .\n`;
        q+= `\t\t\t_:b0 prov:wasDerivedFrom+ [?p ?o] .\n`;
        q+= `\t\t\t_:b0 prov:generatedAtTime ?tc .\n`;
        q+= `\t\t}\n`;
        q+= `\t} GROUP BY ?propertyURI }\n`;
        //Get data about calculation
        q+= `\t#GET DATA ABOUT CALCULATION\n`;
        q+= `\tGRAPH ?gi {\n`;
        q+= `\t\t${evalPath}\n`;
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
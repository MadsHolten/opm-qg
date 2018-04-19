import * as _ from "underscore";
import * as _s from "underscore.string";
import { BaseModel } from "./base";
import { Prefix, Literal, Base } from "./base";

export interface PostPutFoIProp extends Base {
    foiURI?: string;
    path?: string;
    inferredProperty: string;
    value: Literal;
    reliability?: string;
}

export interface DelProp extends Base {
    propertyURI: string;
}

export interface SetReliability extends Base {
    propertyURI: string;
    reliability: string;
}

export interface PutProp extends Base {
    propertyURI: string;
    value: Literal;
    reliability?: string;
}

export interface GetProp {
    foiURI?: string;
    property?: string;
    propertyURI?: string;
    restriction?: string;
    language?: string;
    latest?: boolean;
    queryType?: string;
}

export class OPMProp extends BaseModel {

    private err: string;

    //List outdated properties (calculations)
    //Checks either generally or for a specific FoI
    //Returns the following:
    listOutdated(input: GetProp): string{
        var foiURI = input.foiURI;
        var queryType = input.queryType ? input.queryType : this.queryType;

        var q = '';
        //Define prefixes
        q+= 'PREFIX prov: <http://www.w3.org/ns/prov#>\n';
        q+= 'PREFIX opm:  <https://w3id.org/opm#>\n';
        q+= 'PREFIX cdt:  <http://w3id.org/lindt/custom_datatypes#>\n';

        if(queryType == 'construct'){
            q+= 'CONSTRUCT {\n';
            q+= '\t?foi ?hasProp ?propertyURI .\n';
            q+= '\t?propertyURI opm:hasState ?calcState .\n';
            q+= '\t?calcState a opm:Outdated ;\n';
            q+= '\t\topm:outdatedArgument ?old_arg ;\n';
            q+= '\t\topm:newArgument ?new_arg ;\n';
            q+= '\t\topm:argumentChange ?pct .\n';
            q+= '}\n';
        }else{
            q+= 'SELECT ?propertyURI ?calc_time ?arg_last_update ?new_arg ?old_val ?new_val (?pct AS ?val_change)\n';
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
        q+= `\t\t\t?propertyURI opm:hasState/prov:generatedAtTime ?tc .\n`;
        q+= `\t\t}\n`;
        q+= `\t} GROUP BY ?propertyURI }\n`;
        //Get data about calculation
        q+= `\t#GET DATA ABOUT CALCULATION\n`;
        q+= `\tGRAPH ?gi {\n`;
        q+= `\t\t?foi ?hasProp ?propertyURI .\n`;
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
        q+= `\t#CALCULATE ARGUMENT CHANGE PERCENTAGE\n`;
        q+= `\tBIND(xsd:decimal(strbefore(str(?old_val), " ")) AS ?old)\n`;
        q+= `\tBIND(xsd:decimal(strbefore(str(?new_val), " ")) AS ?new)\n`;
        q+= `\tBIND(IF((?old>?new) , ?old , ?new) AS ?max)\n`;
        q+= `\tBIND(IF((?old<?new) , ?old , ?new) AS ?min)\n`;
        q+= `\tBIND(ROUND(((?max-?min)/?max)*100) AS ?change)\n`;
        q+= `\tBIND(strdt(concat(str(?change), " %"), cdt:ucum) AS ?pct)\n`;
        //Filter to only show outdated calculations
        q+= `\t#ONLY SHOW OUTDATED\n`;
        q+= `\tFILTER(?old != ?new)\n`;
        q+= `}`;
        
        return q;
    }

    /**
     * OTHER
     */
    listSubscribers(input: GetProp): string {
        var propertyURI = input.propertyURI;
        var queryType = input.queryType ? input.queryType : this.queryType;
        var q = '';
        q+= 'PREFIX  opm: <https://w3id.org/opm#>\n';
        q+= 'PREFIX  prov: <http://www.w3.org/ns/prov#>\n';
        q+= 'PREFIX  seas: <https://w3id.org/seas/>\n';
        q+= 'PREFIX  sd: <http://www.w3.org/ns/sparql-service-description#>\n';

        if(queryType == 'construct'){
            q+= 'CONSTRUCT {\n';
            q+= '\t?propertyURI opm:hasSubscriber ?propertyURI .\n';
            q+= '\t?propertyURI sd:namedGraph ?g2 ;\n';
            q+= '\t\tseas:isPropertyOf ?foiURI .\n';
            q+= '}\n';
        }else{
            q+= 'SELECT DISTINCT ?propertyURI (?g2 as ?graphURI) ?foiURI\n';
        }

        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n';
        q+= `\t\tBIND(<${propertyURI}> AS ?propertyURI)\n`;
        q+= `\t\t?propertyURI opm:hasState ?state .\n`;
        q+= `\t}\n`;
        q+= '\tGRAPH ?g2 {\n';
        q+= `\t\t[ ^prov:wasDerivedFrom ?depState ] ?pos ?state .\n`;
        q+= `\t\t?depState ^opm:hasState ?propertyURI .\n`;
        q+= `\t\t#FINDING THE FoI IS ONLY POSSIBLE WITH REASONING\n`;
        q+= `\t\tOPTIONAL { ?propertyURI seas:isPropertyOf ?foiURI . }\n`;
        q+= '\t\t#EXCLUDE DELETED\n';
        q+= '\t\tMINUS { ?depState a opm:Deleted }\n';
        q+= `\t}\n`;
        q+= `}\n`;
        return q;
    }

    getHost(someURI): string {
        var q = '';
        q+='\t#EXTRACT HOST URI\n';
        q+=`\tBIND(IF(CONTAINS(STR(${someURI}), "https://"), "https://", "http://") AS ?http)\n`;
        q+=`\tBIND(STRAFTER(STR(${someURI}), STR(?http)) AS ?substr1)\n`;
        q+='\tBIND(STRAFTER(STR(?substr1), "/") AS ?substr2)\n';
        q+='\tBIND(STRBEFORE(STR(?substr1), "/") AS ?host)\n';
        q+='\tBIND(STRBEFORE(STR(?substr2), "/") AS ?db)\n';
        return q;
    }

    
}
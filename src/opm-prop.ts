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

    //Create property for a FoI where it doesn't already exist
    postFoIProp(input: PostPutFoIProp): string{
        //Retrieve and process variables
        var property = input.inferredProperty;
        var value = input.value.value;
        var datatype = input.value.datatype;
        //Optional
        var foiURI = input.foiURI;  //Either foiURI or path must be specified
        var path = input.path;      //Either foiURI or path must be specified
        var reliability = input.reliability;
        var userURI = input.userURI;
        var comment = input.comment;

        if(!foiURI && !path){
            this.err = "Specify either a foiURI or a path";
        }
        
        //Add prefix(es) to the predefined ones
        var prefixes = this.concatenatePrefixes(input.prefixes);

        //Get reliability class
        if(reliability){
            var reliabilityClass = this.reliabilityClass(reliability);
        }

        //Clean path
        path = path ? this.cleanPath(path) : '?foi ?p ?o .';

        //Clean property (add triangle brackets if not prefixed)
        property = _s.startsWith(property, 'http') ? `<${property}>` : `${property}`;

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }

        q+= 'CONSTRUCT {\n';
        q+= `\t?foi ${property} ?propertyURI .\n`;
        q+= '\t?propertyURI a opm:Property ;\n';
        q+= '\t\trdfs:label "Typed Property"@en ;\n';
        q+= '\t\topm:hasState ?stateURI .\n';
        if(reliabilityClass){
            q+= `\t?stateURI a ${reliabilityClass} .\n`;
        }
        if(userURI){
            q+= `\t?stateURI prov:wasAttributedTo <${userURI}> .\n`;
        }
        if(comment){
            q+= `\t?stateURI rdfs:comment "${comment}" .\n`;
        }
        q+= '\t?stateURI a opm:State ;\n';
        q+= '\t\trdfs:label "Typed State"@en ;\n';
        q+= '\t\topm:valueAtState ?val ;\n';
        q+= '\t\tprov:generatedAtTime ?now .\n';
        q+= '}\n';
        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n';
        //If posting to a specific FoI
        if(foiURI){
            q+= `\t\tBIND(<${foiURI}> AS ?foi)\n`;
        }
        q+= `\t\t{ SELECT DISTINCT ?foi WHERE {\n`;
        q+= `\t\t\t${path}\n`;
        q+= '\t\t}}\n';
        q+= '\t\t#THE FoI CANNOT HAVE THE PROPERTY ASSIGNED ALREADY\n';
        q+= `\t\tMINUS { ?foi ${property} ?prop . }\n`;
        q+= '\t}\n'
        q+= `\tBIND(strdt(str("${value}"), ${datatype}) AS ?val)\n`;
        q+= `\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n`;
        q+= this.getHost('?foi');
        q+= '\t#CREATE STATE AND PROPERTY URI´s\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/Property/", ?guid)) AS ?propertyURI)\n';
        q+= `\tBIND(now() AS ?now)\n`;
        q+= '}\n'
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Update FoI property
    putFoIProp(input: PostPutFoIProp): string{
        //Retrieve and process variables
        var property = input.inferredProperty;
        var value = input.value.value;
        var datatype = input.value.datatype;
        //Optional
        var foiURI = input.foiURI;  //Either foiURI or path must be specified
        var path = input.path;      //Either foiURI or path must be specified
        var reliability = input.reliability;
        var userURI = input.userURI;
        var comment = input.comment;

        if(!foiURI && !path){
            this.err = "Specify either a foiURI or a path";
        }

        //Add prefix(es) to the predefined ones
        var prefixes = this.concatenatePrefixes(input.prefixes);

        //Get reliability class
        if(reliability){
            var reliabilityClass = this.reliabilityClass(reliability);
        }

        //Clean path
        path = path ? this.cleanPath(path) : '?foi ?p ?o .';

        //Clean property (add triangle brackets if not prefixed)
        property = _s.startsWith(property, 'http') ? `<${property}>` : `${property}`;

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }

        //Only makes an update if the value is different from the last evaluation
        q+= 'CONSTRUCT {\n';
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        if(userURI){
            q+= `\t?stateURI prov:wasAttributedTo <${userURI}> .\n`;
        }
        if(comment){
            q+= `\t?stateURI rdfs:comment "${comment}" .\n`;
        }
        q+= '\t?stateURI a opm:State ;\n';
        if(reliabilityClass){
            q+= `\t\ta ${reliabilityClass} ;\n`;
        }
        q+= '\t\trdfs:label "Typed State"@en ;\n';
        q+= '\t\topm:valueAtState ?val ;\n';
        q+= '\t\tprov:generatedAtTime ?now ;\n';
        q+= '\t\topm:error ?error .\n';
        q+= '}\n';
        q+= 'WHERE {\n';
        //If posting to a specific FoI
        if(foiURI){
            q+= `\t\tBIND(<${foiURI}> AS ?foi)\n`;
        }
        q+= '\t#GET LATEST STATE\n';
        q+= '\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n';
        q+= '\t\tGRAPH ?g {\n'
        q+= `\t\t\t?foi ${property} ?propertyURI .\n`;
        q+= '\t\t\t?propertyURI opm:hasState ?state .\n';
        q+= '\t\t\t?state prov:generatedAtTime ?_t .\n';
        if(path){
            q+= `\t\t\t${path}\n`;
        }
        q+= '\t\t}\n';
        q+= '\t} GROUP BY ?propertyURI }\n';

        q+= '\t\t#GET DATA\n';
        q+= '\t\tGRAPH ?g {\n';
        q+= `\t\t\t?foi ${property} ?propertyURI .\n`;
        q+= `\t\t\t?propertyURI opm:hasState ?state .\n`;
        q+= `\t\t\t?state prov:generatedAtTime ?t ;\n`;
        q+= `\t\t\t\topm:valueAtState ?old_val .\n`;
        q+= '\t\t\t#FILTER OUT DELETED OR CONFIRMED\n';
        q+= '\t\t\tMINUS{ ?state a opm:Deleted }\n';
        q+= '\t\t\tMINUS{ ?state a opm:Confirmed }\n';
        if(reliability == 'assumption'){
            q+= `\t\t#MUST NOT BE AN ASSUMPTION ALREADY\n`;
            q+= '\t\tMINUS { ?state a opm:Assumption }\n';
        }
        q+= '\t\t\t#VALUE SHOULD BE DIFFERENT FROM THE PREVIOUS\n';
        q+= `\t\t\tFILTER(str(?old_val) != str("${value}"))\n`;
        q+= '\t\t}\n';
    
        q+= `\tBIND(strdt(str("${value}"), ${datatype}) AS ?val)\n`;
        q+= '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n'
        q+= this.getHost('?foi');
        q+= '\t#CREATE STATE URI´s\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(now() AS ?now)\n';
        q+= '}';
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Get one or more properties
    //Return either for a specific FoI or for all FoIs
    //Return a specific property by defining the property argument
    //Return a specific propertyURI by defining the propertyURI argument
    //Return only the latest state(s) by setting argument latest = true
    //Return select variables by setting argument queryType = 'select'
    //Return graph subset (construct query) by setting argument queryType = 'construct'
    //Restrict to either 'deleted', 'assumptions', 'derived' or 'confirmed'
    getProps(input: GetProp): string {
        var prefixes = this.prefixes;
        var foiURI = input.foiURI;
        var property = input.property;
        var propertyURI = input.propertyURI;
        //Queries all properties as default - else queries a specific property or FoI
        var strLang = (input && input.language) ? input.language : 'en';
        var latest = input.latest;
        var restriction = input.restriction;
        var queryType = input.queryType ? input.queryType : this.queryType;

        //Find restriction class
        if(restriction){
            var restrictionClass = _.chain(this.reliabilityOptions).filter(obj => (obj.key == restriction) ).map(obj => obj.class).first().value();
        }

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }

        if(queryType == 'construct'){
            q+= 'CONSTRUCT {\n';
            q+= '\t?foi ?property ?propertyURI .\n';
            q+= '\t?property rdfs:label ?propertyLabel .\n';
            q+= '\t?propertyURI opm:hasState ?state ;\n';
            q+= '\t\tsd:namedGraph ?g .\n';
            q+= '\t?state prov:generatedAtTime ?ts ;\n';
            q+= '\t\ta ?stateClasses ;\n';
            q+= '\t\topm:valueAtState ?value .\n';
            q+= '}\n';
        }else{
            q+= `SELECT DISTINCT ?foi ?property ?propertyURI ?value (?ts AS ?timestamp) (?state AS ?stateURI) ?label (?g AS ?graphURI)\n`;
        }
        q+= `WHERE {\n`;
        q+= `\tGRAPH ?g {\n`;
        //If querying for a specific FoI
        if(foiURI){
            q+= `\t\tBIND(<${foiURI}> AS ?foi)\n`;
        }
        //If querying for a specific property type
        if(property){
            q+= `\t\tBIND(<${property}> AS ?property)\n`;
        }
        //If querying for a specific property
        if(propertyURI){
            q+= `\t\tBIND(<${propertyURI}> AS ?propertyURI)\n`;
        }

        if(latest){
            q+= `\t\t#GET LATEST STATE\n`;
            q+= `\t\t{ SELECT (MAX(?t) AS ?ts) WHERE {\n`;
            q+= `\t\t\t?foi ?property ?propertyURI .\n`;
            q+= `\t\t\t?propertyURI opm:hasState ?state .\n`;
            q+= `\t\t\t?state prov:generatedAtTime ?t .\n`;
            q+= '\t\t} GROUP BY ?propertyURI }\n'
        }
        q+= '\t\t?foi ?property ?propertyURI .\n';
        q+= '\t\t?propertyURI opm:hasState ?state .\n';
        q+= '\t\t?state prov:generatedAtTime ?ts ;\n';
        q+= '\t\t\ta ?stateClasses .\n';
        q+= '\t\tOPTIONAL{ ?state opm:valueAtState ?value . }\n';
        if(restriction != 'deleted'){
            q+= '\t\t#FILTER OUT DELETED PROPERTIES\n';
            q+= '\t\tMINUS{?state a opm:Deleted}\n';
        }
        if(restriction){
            q+= '\t\t#RESTRICT VALUES\n';
            q+= `\t\t?state a ${restrictionClass} .\n`;
        }
        q+= '\t}\n';

        q+= `\t#RETRIEVE LABEL FROM ONTOLOGY IF AVAILABLE\n`;
        q+= `\tOPTIONAL{\n`;
        q+= `\t\tGRAPH ?gy {\n`;
        q+= `\t\t\t?property rdfs:label ?propertyLabel\n`;
        q+= `\t\t\tFILTER(lang(?propertyLabel)="${strLang}")\n`;
        q+= '\t\t}\n';
        q+= '\t}\n';
        q+= '}';

        return q;
    }

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
     * BY PROPERTY
     */

    //Update a property
    putProp(input: PutProp): string {
        //Retrieve and process variables
        var propertyURI = input.propertyURI;
        var value = input.value.value;
        var datatype = input.value.datatype;
        //Optional
        var userURI = input.userURI;
        var comment = input.comment;
        var reliability = input.reliability;

        //Get reliability class
        if(reliability){
            var reliabilityClass = this.reliabilityClass(reliability);
        }

        //Add prefix(es) to the predefined ones
        var prefixes = this.concatenatePrefixes(input.prefixes);

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }

        //Only makes an update if the value is different from the last evaluation
        q+= 'CONSTRUCT {\n';
        q+= `\t?propertyURI opm:hasState ?stateURI .\n`;
        if(userURI){
            q+= `\t?stateURI prov:wasAttributedTo <${userURI}> .\n`;
        }
        if(comment){
            q+= `\t?stateURI rdfs:comment "${comment}" .\n`;
        }
        if(reliabilityClass){
            q+= `\t?stateURI a ${reliabilityClass} .\n`;
        }
        q+= '\t?stateURI a opm:State ;\n';
        q+= '\t\trdfs:label "Typed State"@en ;\n';
        q+= '\t\topm:valueAtState ?val ;\n';
        q+= '\t\tprov:generatedAtTime ?now ;\n';
        q+= '\t\topm:error ?error .\n';
        q+= '}\n';
        q+= 'WHERE {\n';
        q+= `\tBIND(<${propertyURI}> AS ?propertyURI)\n`;
        q+= '\t\tGRAPH ?g {\n';
        q+= '\t#GET LATEST STATE\n';
        q+= '\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n';
        q+= `\t\t\t?propertyURI opm:hasState ?state .\n`;
        q+= '\t\t\t?state prov:generatedAtTime ?_t .\n';
        q+= '\t} GROUP BY ?propertyURI }\n';

        q+= '\t\t#GET DATA\n';
        q+= `\t\t\t?propertyURI opm:hasState ?state .\n`;
        q+= `\t\t\t?state prov:generatedAtTime ?t ;\n`;
        q+= `\t\t\t\topm:valueAtState ?old_val.\n`;
        q+= '\t\t\t#FILTER OUT DELETED OR CONFIRMED\n';
        q+= '\t\t\tMINUS{ ?state a opm:Deleted }\n';
        q+= '\t\t\tMINUS{ ?state a opm:Confirmed }\n';
        if(reliability == 'assumption'){
            q+= `\t\t\t#MUST NOT BE AN ASSUMPTION ALREADY\n`;
            q+= '\t\t\tMINUS { ?state a opm:Assumption }\n';
        }
        q+= '\t\t\t#VALUE SHOULD BE DIFFERENT FROM THE PREVIOUS\n';
        q+= `\t\t\tFILTER(str(?old_val) != str("${value}"))\n`;
        q+= '\t\t}\n';
              
        q+= `\tBIND(strdt(str("${value}"), ${datatype}) AS ?val)\n`;
        q+= '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n'
        q+= this.getHost('?propertyURI');
        q+= '\t#CREATE STATE URI´s\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(now() AS ?now)\n';
        //q+= '\t#ERRORS\n';
        //q+= `\tBIND(IF(strbefore(str(?old_val), " ") = str(70), "The specified value is the same as the previous", "") AS ?error)\n`;
        q+= '}';
        if(this.err){q = 'Error: '+this.err;}

        return q;
    }

    //Restore a deleted property
    restoreProp(input): string {
        var userURI = input.userURI;
        var comment = input.comment;
        var propertyURI = input.propertyURI;
        var prefixes = input.prefixes;
        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }
        q+= 'CONSTRUCT {\n';
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        if(userURI){
            q+= `\t?stateURI prov:wasAttributedTo <${userURI}> .\n`;
        }
        if(comment){
            q+= `\t?stateURI rdfs:comment "${comment}" .\n`;
        }
        q+= '\t?stateURI a ?previousClasses ;\n';
        q+= '\trdfs:label ?previousLabels ;\n';
        q+= '\t\topm:valueAtState ?value ;\n';
        q+= '\t\tprov:generatedAtTime ?now ;\n';
        q+= '\t\topm:expression ?expression ;\n';
        q+= '\t\tprov:wasDerivedFrom ?dependencies .\n';
        q+= '}\n'
        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n'

        //Get latest state
        q+= `\t\t#GET TIME OF LATEST STATE\n`;
        q+= `\t\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n`;
        q+= `\t\t\t${propertyURI} opm:hasState ?state .\n`;
        q+= `\t\t\t?state prov:generatedAtTime ?_t ;\n`;
        q+= `\t\t\t\t^opm:hasState ?propertyURI .\n`;
        q+= '\t\t} GROUP BY ?propertyURI }\n';

        //Make sure it is deleted and get data
        q+= `\t\t#A STATE MUST EXIST AND IT SHOULD BE DELETED\n`;
        q+= `\t\t?propertyURI opm:hasState ?state .\n`;
        q+= `\t\t?state prov:generatedAtTime ?t ;\n`;
        q+= '\t\t\ta opm:Deleted .\n';

        //Get latest value
        q+= `\t\t#GET TIME OF LAST VALUE\n`;
        q+= `\t\t{ SELECT ?propertyURI (MAX(?_t) AS ?tval) WHERE {\n`;
        q+= `\t\t\t?propertyURI opm:hasState ?st .\n`;
        q+= `\t\t\t?st prov:generatedAtTime ?_t ;\n`;
        //Must have a value assigned
        q+= `\t\t\t\topm:valueAtState ?val .\n`;
        q+= '\t\t} GROUP BY ?propertyURI }\n';
        //Get data
        q+= `\t\t#GET DATA\n`;
        q+= `\t\t?st prov:generatedAtTime ?tval ;\n`;
        q+= '\t\t\topm:valueAtState ?value ;\n';
        q+= '\t\t\ta ?previousClasses .\n';
        q+= '\t\t\tOPTIONAL{?st rdfs:label ?previousLabels .}\n';
        q+= '\t\t\tOPTIONAL{?st opm:expression ?expression .}\n';
        q+= '\t\t\tOPTIONAL{?st prov:wasDerivedFrom ?dependencies .}\n';
        q+= '\t}\n'
        q+= '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q+= this.getHost(propertyURI);
        q+= '\t#CREATE STATE URI\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(now() AS ?now)\n'

        q+= '}';
        return q;
    }

    //Set reliability
    //Make it an assumption or a confirmed property
    //Also possible to delete it
    setReliability(input: SetReliability): string {
        var comment = input.comment;
        var propertyURI = input.propertyURI;
        var reliability = input.reliability;
        var userURI = input.userURI;
        var prefixes = this.prefixes;

        //Get reliability class
        var reliabilityClass = this.reliabilityClass(reliability);

        if(!userURI && reliability == 'confirmed') this.err = "A user must be atrributed to a confirmed value. Please specify a userURI";
        if(!reliability) this.err = "Reliability specification missing.";

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }
        q+= 'CONSTRUCT {\n';
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        //Assign value directly to property when confirmed?
        //Mark property as confirmed?
        if(comment){
            q+= `\t?stateURI rdfs:comment "${comment}" .\n`;
        }
        q+= `\t?stateURI a opm:State , ${reliabilityClass} ;\n`;
        q+= `\t\trdfs:label "${_s.capitalize(reliability)} State"@en ;\n`;
        q+= '\t\tprov:generatedAtTime ?now .\n';
        //Deleted states don't have a value
        if(reliability != 'deleted'){
            q+= '\t\t?stateURI opm:valueAtState ?value .\n';
        }

        if(userURI){
            q+= `\t?stateURI prov:wasAttributedTo <${userURI}> .\n`;
        }
        q+= '}\n'
        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n'
        //Set for specific propertyURI
        q+= `\t\tBIND(<${propertyURI}> AS ?propertyURI)\n`;
        //Get latest state
        q+= `\t\t#GET LATEST STATE\n`;
        q+= `\t\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n`;
        q+= `\t\t\t?propertyURI opm:hasState ?state .\n`;
        q+= `\t\t\t?state prov:generatedAtTime ?_t .\n`;
        q+= '\t\t} GROUP BY ?propertyURI }\n';

        //Make sure it is not deleted or confirmed and get data
        q+= `\t\t#A STATE MUST EXIST AND MUST NOT BE DELETED OR CONFIRMED\n`;
        q+= `\t\t?propertyURI opm:hasState ?state .\n`;
        q+= `\t\t?state prov:generatedAtTime ?t .\n`;
        if(reliability != 'deleted'){
            q+= `\t\t\t?state opm:valueAtState ?value .\n`;
        }
        q+= '\t\tMINUS { ?state a opm:Deleted }\n';
        q+= '\t\tMINUS { ?state a opm:Confirmed }\n';
        if(reliability == 'assumption'){
            q+= `\t\t#MUST NOT BE AN ASSUMPTION ALREADY\n`;
            q+= '\t\tMINUS { ?state a opm:Assumption }\n';
        }
        //Omit derived values (these are confirmed when all arguments are confirmed)
        q+= `\t\t#A DERIVED PROPERTY CAN'T BE CONFIRMED - ARGUMENTS ARE CONFIRMED\n`;
        q+= '\t\tMINUS { ?state a opm:Derived }\n';
        q+= '\t\tMINUS { ?state prov:wasDerivedFrom ?dependencies }\n';
        q+= '\t}\n';
        q+= '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q+= this.getHost('?propertyURI');
        q+= '\t#CREATE STATE URI\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(now() AS ?now)\n';
        q+= '}';
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Delete property
    deleteProp(input: DelProp){
        var args = input as SetReliability;
        args.reliability = 'deleted';
        return this.setReliability(args);
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

    cleanPath(path){
        return _.map(path => {
            //Should begin with ?foi
            var firstVar = '?'+_s.strLeft(_s.strRight(path, '?'), ' ');
            if(firstVar != '?foi'){
                path = path.replace(firstVar, '?foi');
            }
            return path;
        });
    }

    reliabilityClass(reliability){
        var options = _.filter(this.reliabilityOptions, obj => (obj.key != 'derived')); //Derived can not be set as it is only inferred for derived properties
        if(!_.chain(options).filter(obj => (obj.key == reliability) ).first().value()){
            this.err = "Unknown restriction. Use either "+_s.toSentence(_.pluck(options, 'key'), ', ', ' or ')
        }
        return _.chain(options).filter(obj => (obj.key == reliability) ).map(obj => obj.class).first().value();
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
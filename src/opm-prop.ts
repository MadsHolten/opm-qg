import { IProp } from "./interfaces";
import * as _ from "underscore";
import * as _s from "underscore.string";

export class OPMProp {
    private input: IProp;
    private err: string;
    private queryType: string;
    private reliabilityOptions = [
        {'key': 'deleted', 'class': 'opm:Deleted'},
        {'key': 'assumption', 'class': 'opm:Assumption'},
        {'key': 'derived', 'class': 'opm:Derived'},
        {'key': 'confirmed', 'class': 'opm:Confirmed'}
    ];
    private reliabilityClass: string;

    constructor(input: IProp) {
        this.input = input;
        if(input){
            //Default query type is construct
            this.queryType = this.input.queryType ? this.input.queryType : 'construct';

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
            if(!_.contains(prefixes, 'rdfs')){
                this.input.prefixes.push({prefix: 'rdfs', uri: 'http://www.w3.org/2000/01/rdf-schema#'});
            }
            if(!_.contains(prefixes, 'opm')){
                this.input.prefixes.push({prefix: 'opm', uri: 'https://w3id.org/opm#'});
            }
            if(!_.contains(prefixes, 'sd')){
                this.input.prefixes.push({prefix: 'sd', uri: 'http://www.w3.org/ns/sparql-service-description#'});
            }
            //datatype defaults to xsd:string
            if(this.input.value){
                this.input.value.datatype = this.input.value.datatype ? this.input.value.datatype : 'xsd:string';
                //PropertyURI can be either prefixed or as a regular URI
                if(this.input.value.property){
                    var propertyURI = this.input.value.property
                    this.input.value.property = _s.startsWith(propertyURI, 'http') ? `<${propertyURI}>` : `${propertyURI}`;
                }
            }
            //If no FoI URI is specified, some pattern must exist
            if(!this.input.foiURI){
                if(!this.input.pattern && !this.input.propertyURI){
                    this.err = "When no foiURI is specified a pattern must exist!";
                }else{
                    this.input.foiURI = '?foi';
                    //Clean pattern
                    var str: string = this.input.pattern;
                    str = _s.clean(str); //Remove unnecessary spaces etc.
                    str = _s.endsWith(str,".") ? str+' ' : str+' . '; //Make sure it ends with a dot and a space
                    this.input.pattern = str;
                }
            }else{
                this.input.foiURI = `<${this.input.foiURI}>`;
            }
            //PropertyURI can be either prefixed or as a regular URI
            if(this.input.propertyURI){
                var propertyURI = this.input.propertyURI
                this.input.propertyURI = _s.startsWith(propertyURI, 'http') ? `<${propertyURI}>` : `${propertyURI}`;
            }
            if(this.input.userURI){
                var userURI = this.input.userURI;
                this.input.userURI = `<${userURI}>`;
            }
            //Restriction must be valid
            if(this.input.reliability){
                var reliability = this.input.reliability;
                var options = _.filter(this.reliabilityOptions, obj => (obj.key != 'derived'));
                if(!_.chain(options).filter(obj => (obj.key == reliability) ).first().value()){this.err = "Unknown restriction. Use either "+_s.toSentence(_.pluck(options, 'key'), ', ', ' or ')};
                this.reliabilityClass = _.chain(options).filter(obj => (obj.key == reliability) ).map(obj => obj.class).first().value();
            }
        }else{
            this.queryType = 'construct';
        }
    }

    /**
     * BY FoI
     */

    //Create property for a FoI where it doesn't already exist
    postFoIProp(): string{
        //Retrieve and process variables
        var userURI = this.input.userURI;
        var comment = this.input.comment;
        var prefixes = this.input.prefixes;
        var foiURI = this.input.foiURI;
        var property = this.input.value.property;
        var value = this.input.value.value;
        var unit = this.input.value.unit;
        var datatype = this.input.value.datatype;
        var foiURI = this.input.foiURI;
        var reliability = this.input.reliability;
        var reliabilityClass = this.reliabilityClass;
        
        if(foiURI == '?foi'){
            var pattern = `{ SELECT DISTINCT ?foi WHERE { ${this.input.pattern} }}\n`;
        }else{
            var pattern = `{ SELECT DISTINCT ?foi WHERE { ?foi ?p ?o . } }\n`;
        }

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
            q+= `\t?stateURI prov:wasAttributedTo ${userURI} .\n`;
        }
        if(comment){
            q+= `\t?stateURI rdfs:comment "${comment}"^^xsd:string .\n`;
        }
        q+= '\t?stateURI a opm:State ;\n';
        q+= '\t\trdfs:label "Typed State"@en ;\n';
        q+= '\t\topm:valueAtState ?val ;\n';
        q+= '\t\tprov:generatedAtTime ?now .\n';
        q+= '}\n';
        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n';
        if(foiURI != '?foi'){
            q+= `\t\tBIND(${foiURI} AS ?foi)\n`;
        }
        q+= `\t\t${pattern}`;
        q+= '\t\t#THE FoI CANNOT HAVE THE PROPERTY ASSIGNED ALREADY\n';
        q+= `\t\tMINUS { ?foi ${property} ?prop . }\n`;
        q+= '\t}\n'
        q+= `\tBIND(strdt(concat(str(${value}), " ${unit}"), ${datatype}) AS ?val)\n`;
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
    putFoIProp(): string{
        //Retrieve and process variables
        var userURI = this.input.userURI;
        var comment = this.input.comment;
        var prefixes = this.input.prefixes;
        var foiURI = this.input.foiURI;
        var property = this.input.value.property;
        var value = this.input.value.value;
        var unit = this.input.value.unit;
        var datatype = this.input.value.datatype;
        var pattern = this.input.pattern;
        var foiURI = this.input.foiURI;
        var reliability = this.input.reliability;
        var reliabilityClass = this.reliabilityClass;

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }

        //Only makes an update if the value is different from the last evaluation
        q+= 'CONSTRUCT {\n';
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        if(userURI){
            q+= `\t?stateURI prov:wasAttributedTo ${userURI} .\n`;
        }
        if(comment){
            q+= `\t?stateURI rdfs:comment "${comment}"^^xsd:string .\n`;
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

        q+= '\t#GET LATEST STATE\n';
        q+= '\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n';
        q+= '\t\tGRAPH ?g {\n'
        q+= `\t\t\t${foiURI} ${property} ?propertyURI .\n`;
        q+= '\t\t\t?propertyURI opm:hasState ?state .\n';
        q+= '\t\t\t?state prov:generatedAtTime ?_t .\n';
        q+= pattern ? `\t\t\t${pattern}\n` : '';
        q+= '\t\t}\n';
        q+= '\t} GROUP BY ?propertyURI }\n';

        q+= '\t\t#GET DATA\n';
        q+= '\t\tGRAPH ?g {\n';
        q+= `\t\t\t${foiURI} ${property} ?propertyURI .\n`;
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
        q+= `\t\t\tFILTER(strbefore(str(?old_val), " ") != str(${value}))\n`;
        q+= '\t\t}\n';
    
        q+= `\tBIND(strdt(concat(str(${value}), " ${unit}"), ${datatype}) AS ?val)\n`;
        q+= '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n'
        q+= this.getHost(foiURI);
        q+= '\t#CREATE STATE URI´s\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(now() AS ?now)\n';
        q+= '}';
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Get FoI properties
    //Return either for a specific FoI or for all FoIs
    //Return a specific property by defining the propertyURI argument
    //Return only the latest state(s) by setting argument latest = true
    //Return select variables by setting argument queryType = 'select'
    //Return graph subset (xonstruct query) by setting argument queryType = 'construct'
    //Restrict to either 'deleted', 'assumptions', 'derived' or 'confirmed'
    getFoIProps(): string {
        var prefixes = (this.input && this.input.prefixes) ? this.input.prefixes : undefined;
        var foiURI = (this.input && this.input.foiURI) ? this.input.foiURI : '?foiURI';
        //Queries all properties as default - else queries a specific property
        var property = (this.input && this.input.propertyURI) ? this.input.propertyURI : '?property';
        var strLang = (this.input && this.input.language) ? this.input.language : 'en';
        var evalPath: string = '';
        var latest = this.input.latest;
        var restriction = this.input.restriction;
        if(restriction){
            var restrictionClass = _.chain(this.reliabilityOptions).filter(obj => (obj.key == restriction) ).map(obj => obj.class).first().value();
        }

        var q: string = '';
        //Define prefixes
        if(prefixes){
            for(var i in prefixes){
                q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
            }
        }else{
            q+= 'PREFIX seas: <https://w3id.org/seas/>\n';
            q+= 'PREFIX opm: <https://w3id.org/opm#>\n';
            q+= 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n';
            q+= 'PREFIX prov: <http://www.w3.org/ns/prov#>\n';
        }
        if(this.queryType == 'construct'){
            q+= 'CONSTRUCT {\n';
            q+= '\t?foiURI ?property ?propertyURI .\n';
            q+= '\t?property rdfs:label ?propertyLabel .\n';
            q+= '\t?propertyURI opm:hasState ?state ;\n';
            q+= '\t\tsd:namedGraph ?g .\n';
            q+= '\t?state prov:generatedAtTime ?ts ;\n';
            q+= '\t\ta ?stateClasses ;\n';
            q+= '\t\topm:valueAtState ?value ;\n';
            q+= '\t\tprov:wasDerivedFrom ?derivedFrom ;\n';
            q+= '\t\topm:expression ?expression ;\n';
            q+= '\t\tprov:wasAttributedTo ?user .\n';
            q+= '}\n';
        }else{
            q+= `SELECT DISTINCT ?foiURI ?property ?propertyURI ?value (?ts AS ?timestamp) (?state AS ?stateURI) ?label (?g AS ?graphURI)\n`;
        }
        q+= `WHERE {\n`;
        q+= `\tGRAPH ?g {\n`;

        if(latest){
            q+= `\t\t#GET LATEST STATE\n`;
            q+= `\t\t{ SELECT (MAX(?t) AS ?ts) WHERE {\n`;
            q+= `\t\t\t${foiURI} ${property} ?propertyURI .\n`;
            q+= `\t\t\t?propertyURI opm:hasState ?state .\n`;
            q+= `\t\t\t?state prov:generatedAtTime ?t .\n`;
            q+= '\t\t} GROUP BY ?propertyURI }\n'
        }else{
            q+= `\t\t${foiURI} ${property} ?propertyURI .\n`;
        }
        q+= '\t\t?foiURI ?property ?propertyURI .\n';
        q+= '\t\t?propertyURI opm:hasState ?state .\n';
        q+= '\t\t?state prov:generatedAtTime ?ts ;\n';
        q+= '\t\t\ta ?stateClasses .\n';
        q+= '\t\tOPTIONAL{ ?state opm:valueAtState ?value . }\n';
        q+= '\t\tOPTIONAL{ ?state prov:wasAttributedTo ?user . }\n';
        q+= '\t\tOPTIONAL{ ?state prov:wasDerivedFrom [ ?pos ?derivedFrom ] .\n'; 
        q+= '\t\t\t  FILTER(?derivedFrom != rdf:Seq) }\n';
        q+= '\t\tOPTIONAL{ ?state opm:expression ?expression . }\n';
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

    /**
     * BY PROPERTY
     */

    //Get a single property
    getProp(): string {
        var prefixes = this.input.prefixes;
        var propertyURI = this.input.propertyURI;
        var latest = this.input.latest;
        

        if(!propertyURI) this.err = "Please specify a propertyURI";

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }
        if(this.queryType == 'construct'){
            q+= 'CONSTRUCT {\n';
            q+= '\t?foiURI ?property ?propertyURI .\n';
            q+= '\t?propertyURI opm:hasState ?state ;\n';
            q+= '\t\tsd:namedGraph ?g .\n';
            q+= '\t?state prov:generatedAtTime ?timestamp ;\n';
            q+= '\t\ta ?stateClasses ;\n';
            q+= '\t\topm:valueAtState ?value ;\n';
            q+= '\t\tprov:wasDerivedFrom ?derivedFrom ;\n';
            q+= '\t\topm:expression ?expression ;\n';
            q+= '\t\tprov:wasAttributedTo ?user .\n';
            q+= '}\n';
        }else{
            q+= `SELECT ?value ?timestamp (?g AS ?graphURI)\n`;
        }
        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n';
        if(latest){
            q+= `\t\t{ SELECT (MAX(?t) AS ?timestamp) WHERE {\n`;
            q+= `\t\t\t${propertyURI} opm:hasState ?state .\n`;
            q+= `\t\t\t?state prov:generatedAtTime ?t ;\n`;
            q+= '\t\t\t^opm:hasState ?propertyURI .\n';
            q+= '\t\t} GROUP BY ?propertyURI }\n'
        }else{
            q+= `\t\t${propertyURI} opm:hasState ?state .\n`;
            q+= '\t\t?state ^opm:hasState ?propertyURI .\n';
        }
        q+= `\t\t?foiURI ?property ?propertyURI .\n`;
        q+= `\t\t?propertyURI opm:hasState ?state .\n`;
        q+= '\t\t?state prov:generatedAtTime ?timestamp ;\n';
        q+= '\t\t\ta ?stateClasses .\n';
        q+= '\t\tOPTIONAL{?state opm:valueAtState ?value .}\n';
        q+= '\t\tOPTIONAL{?state prov:wasAttributedTo ?user .}\n';
        q+= '\t\tOPTIONAL{?state prov:wasDerivedFrom [ ?pos ?derivedFrom ] .}\n';
        q+= '\t\tOPTIONAL{?state opm:expression ?expression .}\n';
        q+= '\t\t#FILTER OUT DELETED PROPERTIES\n';
        q+= '\t\tMINUS{?state a opm:Deleted}\n';
        q+= `\t}\n`;
        q+= `}`;
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Update a property
    putProp(): string {
        //Retrieve and process variables
        var userURI = this.input.userURI;
        var comment = this.input.comment;
        var prefixes = this.input.prefixes;
        var propertyURI = this.input.propertyURI;
        var value = this.input.value.value;
        var unit = this.input.value.unit;
        var datatype = this.input.value.datatype;
        var reliability = this.input.reliability;
        var reliabilityClass = this.reliabilityClass;

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }

        //Only makes an update if the value is different from the last evaluation
        q+= 'CONSTRUCT {\n';
        q+= `\t?propertyURI opm:hasState ?stateURI .\n`;
        if(userURI){
            q+= `\t?stateURI prov:wasAttributedTo ${userURI} .\n`;
        }
        if(comment){
            q+= `\t?stateURI rdfs:comment "${comment}"^^xsd:string .\n`;
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
        q+= `\tBIND(${propertyURI} AS ?propertyURI)\n`;
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
        q+= `\t\t\tFILTER(strbefore(str(?old_val), " ") != str(${value}))\n`;
        q+= '\t\t}\n';
              
        q+= `\tBIND(strdt(concat(str(${value}), " ${unit}"), ${datatype}) AS ?val)\n`;
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

    //Delete a property
    //Maybe make two - a force one that doesn't take dependencies and 
    //confirmed properties into account and a regular one that will not
    //delete properties other depend on or that are confirmed
    deleteProp(): string {
        var userURI = this.input.userURI;
        var comment = this.input.comment;
        var propertyURI = this.input.propertyURI;
        var prefixes = this.input.prefixes;
        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }
        q+= 'CONSTRUCT {\n';
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        if(userURI){
            q+= `\t?stateURI prov:wasAttributedTo ${userURI} .\n`;
        }
        if(comment){
            q+= `\t?stateURI rdfs:comment "${comment}"^^xsd:string .\n`;
        }
        q+= '\t?stateURI a opm:State , opm:Deleted ;\n';
        q+= '\t\trdfs:label "Deleted State"@en ;\n';
        q+= '\t\tprov:generatedAtTime ?now .\n';
        q+= '}\n'
        q+= 'WHERE {\n';

        //Get latest state
        q+= `\t#GET LATEST STATE\n`;
        q+= `\t{ SELECT (MAX(?_t) AS ?t) WHERE {\n`;
        q+= `\t\tGRAPH ?g {\n`;
        q+= `\t\t\t${propertyURI} opm:hasState/prov:generatedAtTime ?_t .\n`;
        q+= '\t\t}\n';
        q+= '\t} }\n';

        q+= `\t#A STATE MUST EXIST AND IT MUST NOT BE DELETED ALREADY\n`;
        q+= '\tGRAPH ?g {\n'
        q+= `\t\t${propertyURI} opm:hasState ?state .\n`;
        q+= `\t\t?state prov:generatedAtTime ?t ;\n`;
        q+= '\t\t\t^opm:hasState ?propertyURI .\n';
        q+= '\t\tMINUS { ?state a opm:Deleted }\n';
        //A confirmed property should not be deletable, right?
        //Especially not if people use it - so maybe make this restriction
        //q+= '\t\tMINUS { ?state a opm:Confirmed }\n';
        q+= '\t}\n'
        q+= '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q+= this.getHost(propertyURI);
        q+= '\t#CREATE STATE URI\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(now() AS ?now)\n'

        q+= '}';
        return q;
    }

    //Restore a deleted property
    restoreProp(): string {
        var userURI = this.input.userURI;
        var comment = this.input.comment;
        var propertyURI = this.input.propertyURI;
        var prefixes = this.input.prefixes;
        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }
        q+= 'CONSTRUCT {\n';
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        if(userURI){
            q+= `\t?stateURI prov:wasAttributedTo ${userURI} .\n`;
        }
        if(comment){
            q+= `\t?stateURI rdfs:comment "${comment}"^^xsd:string .\n`;
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

    setReliability(): string {
        var comment = this.input.comment;
        var propertyURI = this.input.propertyURI;
        var reliability = this.input.reliability;
        var reliabilityClass = this.reliabilityClass;
        var userURI = this.input.userURI;
        var prefixes = this.input.prefixes;

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
            q+= `\t?stateURI rdfs:comment "${comment}"^^xsd:string .\n`;
        }
        q+= `\t?stateURI a opm:State , ${reliabilityClass} ;\n`;
        q+= '\t\trdfs:label "Confirmed State"@en ;\n';
        q+= '\t\topm:valueAtState ?value ;\n';
        q+= '\t\tprov:generatedAtTime ?now .\n';
        if(userURI){
            q+= `\t?stateURI prov:wasAttributedTo ${userURI} .\n`;
        }
        q+= '}\n'
        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n'

        //Get latest state
        q+= `\t\t#GET LATEST STATE\n`;
        q+= `\t\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n`;
        q+= `\t\t\t${propertyURI} opm:hasState ?state .\n`;
        q+= `\t\t\t?state prov:generatedAtTime ?_t ;\n`;
        q+= `\t\t\t\t^opm:hasState ?propertyURI .\n`;
        q+= '\t\t} GROUP BY ?propertyURI }\n';

        //Make sure it is not deleted or confirmed already and get data
        q+= `\t\t#A STATE MUST EXIST AND MUST NOT BE DELETED OR CONFIRMED\n`;
        q+= `\t\t?propertyURI opm:hasState ?state .\n`;
        q+= `\t\t?state prov:generatedAtTime ?t ;\n`;
        q+= `\t\t\topm:valueAtState ?value .\n`;
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
        q+= this.getHost(propertyURI);
        q+= '\t#CREATE STATE URI\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(now() AS ?now)\n';
        q+= '}';
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    /**
     * OTHER
     */
    listSubscribers(): string {
        var propertyURI = this.input.propertyURI;
        var q = '';
        q+= 'PREFIX  opm: <https://w3id.org/opm#>\n';
        q+= 'PREFIX  prov: <http://www.w3.org/ns/prov#>\n';
        q+= 'PREFIX  seas: <https://w3id.org/seas/>\n';
        q+= 'PREFIX  sd: <http://www.w3.org/ns/sparql-service-description#>\n';

        if(this.queryType == 'construct'){
            q+= 'CONSTRUCT {\n';
            q+= '\t?origin opm:hasSubscriber ?propertyURI .\n';
            q+= '\t?propertyURI sd:namedGraph ?g2 ;\n';
            q+= '\t\tseas:isPropertyOf ?foiURI .\n';
            q+= '}\n';
        }else{
            q+= 'SELECT DISTINCT ?propertyURI (?g2 as ?graphURI) ?foiURI\n';
        }

        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n';
        q+= `\t\t${propertyURI} opm:hasState ?state .\n`;
        q+= `\t\t?state ^opm:hasState ?origin .\n`;
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
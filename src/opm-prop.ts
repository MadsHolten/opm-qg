import { IProp } from "./interfaces";
import * as _ from "underscore";
import * as _s from "underscore.string";

export class OPMProp {
    private input: IProp;
    private err: string;

    constructor(input: IProp) {
        this.input = input;
        if(input){
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
            //datatype defaults to xsd:string
            if(this.input.value){
                this.input.value.datatype = this.input.value.datatype ? this.input.value.datatype : 'xsd:string';
                //PropertyURI can be either prefixed or as a regular URI
                if(this.input.value.property){
                    var propertyURI = this.input.value.property
                    this.input.value.property = _s.startsWith(propertyURI, 'http') ? `<${propertyURI}>` : `${propertyURI}`;
                }
            }
            //If no resource URI is specified, some pattern must exist
            if(!this.input.resourceURI){
                if(!this.input.pattern && !this.input.propertyURI){
                    this.err = "When no resourceURI is specified a pattern must exist!";
                }else{
                    this.input.resourceURI = '?resource';
                    //Clean pattern
                    var str: string = this.input.pattern;
                    str = _s.clean(str); //Remove unnecessary spaces etc.
                    str = _s.endsWith(str,".") ? str+' ' : str+' . '; //Make sure it ends with a dot and a space
                    this.input.pattern = str;
                }
            }else{
                this.input.resourceURI = `<${this.input.resourceURI}>`;
            }
            //PropertyURI can be either prefixed or as a regular URI
            if(this.input.propertyURI){
                var propertyURI = this.input.propertyURI
                this.input.propertyURI = _s.startsWith(propertyURI, 'http') ? `<${propertyURI}>` : `${propertyURI}`;
            }
        }
    }

    /**
     * BY RESOURCE
     */

    //Create property for a resource where it doesn't already exist
    postResourceProp(): string{
        //Retrieve and process variables
        var prefixes = this.input.prefixes;
        var resource = this.input.resourceURI;
        var property = this.input.value.property;
        var value = this.input.value.value;
        var unit = this.input.value.unit;
        var datatype = this.input.value.datatype;
        var resourceURI = this.input.resourceURI;
        if(resourceURI == '?resource'){
            var pattern = `{ SELECT * WHERE { GRAPH ?g {${this.input.pattern}} }}`;
        }else{
            var pattern = `{ SELECT * WHERE { GRAPH ?g {${resourceURI} ?p ?o} } LIMIT 1}`;
        }

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }

        q+= 'CONSTRUCT {\n';
        q+= `\t${resourceURI} ${property} ?propertyURI .\n`;
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        q+= '\t?stateURI opm:valueAtState ?val ;\n';
        q+= '\t\tprov:generatedAtTime ?now .\n';
        q+= '}\n';
        q+= 'WHERE {\n';
        q+= `\t${pattern}\n`;
        q+= '\tMINUS {\n';
        q+= '\t\tGRAPH ?g {\n';
        q+= `\t\t\t${resourceURI} ${property}/opm:hasState ?eval .\n`;
        q+= '\t\t}\n'
        q+= '\t}\n'
        q+= `\tBIND(strdt(concat(str(${value}), " ${unit}"), ${datatype}) AS ?val)\n`;
        q+= `\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n`;
        q+= this.getHost()
        q+= '\t#CREATE STATE AND PROPERTY URI´s\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), "/", STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), "/", STR(?host), "/", STR(?db), "/Property/", ?guid)) AS ?propertyURI)\n';
        q+= `\tBIND(now() AS ?now)\n`;
        q+= '}\n'
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Update resource property
    putResourceProp(): string{
        //Retrieve and process variables
        var prefixes = this.input.prefixes;
        var resource = this.input.resourceURI;
        var property = this.input.value.property;
        var value = this.input.value.value;
        var unit = this.input.value.unit;
        var datatype = this.input.value.datatype;
        var pattern = this.input.pattern;
        var resourceURI = this.input.resourceURI;

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }

        //Only makes an update if the value is different from the last evaluation
        q+= 'CONSTRUCT {\n';
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        q+= '\t?stateURI opm:valueAtState ?val ;\n';
        q+= '\t\tprov:generatedAtTime ?now ;\n';
        q+= '\t\topm:error ?error .\n';
        q+= '}\n';
        q+= 'WHERE {\n';

        q+= '\t#GET LATEST STATE\n';
        q+= '\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n';
        q+= '\t\tGRAPH ?g {\n'
        q+= `\t\t\t${resourceURI} ${property} ?propertyURI .\n`;
        q+= '\t\t\t?propertyURI opm:hasState ?eval .\n';
        q+= '\t\t\t?eval prov:generatedAtTime ?_t .\n';
        q+= pattern ? `\t\t\t${pattern}\n` : '';
        q+= '\t\t}\n';
        q+= '\t} GROUP BY ?propertyURI }\n';

        q+= '\t\t#GET DATA - VALUE SHOULD BE DIFFERENT FROM THE PREVIOUS\n';
        q+= '\t\tGRAPH ?g {\n';
        q+= `\t\t\t${resourceURI} ${property} ?propertyURI .\n`;
        q+= `\t\t\t?propertyURI opm:hasState [ prov:generatedAtTime ?t ;\n`;
        q+= `\t\t\t\topm:valueAtState ?old_val ] .\n`;
        q+= `\t\t\tFILTER(strbefore(str(?old_val), " ") != str(${value}))\n`;
        q+= '\t\t}\n';
              
        q+= `\tBIND(strdt(concat(str(${value}), " ${unit}"), ${datatype}) AS ?val)\n`;
        q+= '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n'
        q+= this.getHost()
        q+= '\t#CREATE STATE AND PROPERTY URI´s\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), "/", STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), "/", STR(?host), "/", STR(?db), "/Property/", ?guid)) AS ?propertyURI)\n';
        q+= '\tBIND(now() AS ?now)\n';
        //q+= '\t#ERRORS\n';
        //q+= `\tBIND(IF(strbefore(str(?old_val), " ") = str(70), "The specified value is the same as the previous", "") AS ?error)\n`;
        q+= '}';
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Get a single property of a resource
    getResourceProp(): string {
        var prefixes = this.input.prefixes;
        var resource = this.input.resourceURI;
        var returnResource = this.input.resourceURI == '?resource' ? true : false;
        var property = this.input.propertyURI;
        var latest = this.input.latest;
        
        if(!property) this.err = "Please specify a propertyURI";

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}>\n`;
        }
        q+= `SELECT ?value ?deleted `;
        q+= latest ? '(?ts AS ?timestamp) ' : '(MAX(?ts) AS ?timestamp) ';
        q+= returnResource ? '?resource\n' : '\n';
        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n';
        if(latest){
            q+= `\t\t{ SELECT (MAX(?t) AS ?ts) WHERE {\n`;
            q+= `\t\t\t${resource} ${property} ?prop .\n`;
            q+= `\t\t\t?prop opm:hasState/prov:generatedAtTime ?t .\n`;
            q+= '\t\t} GROUP BY ?prop }\n'
        }
        q+= `\t\t${resource} ${property} ?prop .\n`;
        q+= `\t\t?prop opm:hasState ?state .\n`;
        q+= `\t\t?state prov:generatedAtTime ?ts ;\n`
        q+= '\t\tOPTIONAL{?state opm:valueAtState ?value .}\n';
        q+= '\t\tOPTIONAL{?state opm:deleted ?deleted .}\n';
        q+= `\t}\n`;
        q+= `}`; 
        if(!latest){
            q+=` GROUP BY ?value ?deleted`
            q+= returnResource ? '?resource' : '';
        }
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Get all resource properties
    getResourceProps(): string {
        var prefixes = this.input.prefixes;
        var resource = this.input.resourceURI ? `${this.input.resourceURI}` : '?resource';
        var strLang = this.input.language;
        var evalPath: string = '';

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }

        q+= `SELECT ?resource ?property ?value ?lastUpdated ?g ?uri ?state ?label ?deleted `;
        q+= `WHERE {\n`;
        q+= `\tGRAPH ?g {\n`;
        q+= `\t\t{ SELECT ?property (MAX(?timestamp) AS ?lastUpdated) WHERE {\n`;
        q+= `\t\t\t${resource} ?property ?propertyURI .\n`;
        q+= `\t\t\t?propertyURI opm:hasState ?state .\n`;
        q+= `\t\t\t?state prov:generatedAtTime ?timestamp .\n`;
        q+= `\t\t} GROUP BY ?property }\n`;
        q+= `\t\tOPTIONAL{\n`
        q+= `\t\t\tGRAPH ?gy {\n`
        q+= `\t\t\t\t?property rdfs:label ?label\n`
        q+= `\t\t}\t\n`;
        q+= `\t\t\tFILTER(lang(?label)="${strLang}")\n`;
        q+= '\t\t}\n';
        q+= '\t\t?resource ?property ?uri .\n';
        q+= '\t\t?uri opm:hasState ?state .\n';
        q+= '\t\t?state prov:generatedAtTime ?lastUpdated .\n';
        q+= '\t\tOPTIONAL{?state opm:valueAtState ?value .}\n';
        q+= '\t\tOPTIONAL{?state opm:deleted ?deleted .}\n';
        q+= `\t\tFILTER(?resource = ${resource})\n`;
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
        q+= `SELECT ?value ?timestamp ?deleted\n`;
        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n';
        if(latest){
            q+= `\t\t{ SELECT (MAX(?t) AS ?timestamp) WHERE {\n`;
            q+= `\t\t\t${propertyURI} opm:hasState ?state .\n`;
            q+= `\t\t\t?state prov:generatedAtTime ?t ;\n`;
            q+= '\t\t\t^opm:hasState ?propertyURI .\n';
            q+= '\t\t} GROUP BY ?propertyURI }\n'
        }
        q+= `\t\t${propertyURI} opm:hasState ?state .\n`;
        q+= '\t\t?state prov:generatedAtTime ?timestamp ;\n';
        q+= '\t\t\t^opm:hasState ?propertyURI .\n';
        q+= '\t\tOPTIONAL{?state opm:valueAtState ?value .}\n';
        q+= '\t\tOPTIONAL{?state opm:deleted ?deleted .}\n';
        q+= `\t}\n`;
        q+= `}`;
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Delete a property
    deleteProp(): string {
        var propertyURI = this.input.propertyURI;
        var prefixes = this.input.prefixes;
        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }
        q+= 'CONSTRUCT {\n';
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        q+= '\t?stateURI prov:generatedAtTime ?now ;\n';
        q+= '\t\topm:deleted "true"^^xsd:boolean .\n';
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
        q+= '\t\tOPTIONAL{\n';
        q+= '\t\t\t?state opm:deleted ?del\n';
        q+= '\t\t\tFILTER(?del != true)\n';
        q+= '\t\t}\n'
        q+= '\t}\n'
        q+= '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q+= this.getHost();
        q+= '\t#CREATE STATE URI\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), "/", STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(now() AS ?now)\n'

        q+= '}';
        return q;
    }

    //Restore a deleted property
    restoreProp(): string {
        var propertyURI = this.input.propertyURI;
        var prefixes = this.input.prefixes;
        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }
        q+= 'CONSTRUCT {\n';
        q+= '\t?propertyURI opm:hasState ?stateURI .\n';
        q+= '\t?stateURI opm:valueAtState ?value ;\n';
        q+= '\t\tprov:generatedAtTime ?now ;\n';
        q+= '\t\topm:expression ?expression ;\n';
        q+= '\t\tprov:wasDerivedFrom ?dependencies .\n';
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

        //Make sure it is deleted and get data
        q+= `\t\t#A STATE MUST EXIST AND IT SHOULD BE DELETED\n`;
        q+= `\t\t?propertyURI opm:hasState ?state .\n`;
        q+= `\t\t?state prov:generatedAtTime ?t ;\n`;
        q+= '\t\t\topm:deleted ?del .\n';
        q+= '\t\tFILTER(?del = true)\n';

        //Get latest value
        q+= `\t\t#RETRIEVE LAST VALUE\n`;
        q+= `\t\t{ SELECT ?propertyURI (MAX(?_t) AS ?tval) WHERE {\n`;
        q+= `\t\t\t?propertyURI opm:hasState ?st .\n`;
        q+= `\t\t\t?st prov:generatedAtTime ?_t ;\n`;
        q+= `\t\t\t\t opm:valueAtState ?val .\n`;
        q+= '\t\t} GROUP BY ?propertyURI }\n';
        q+= `\t\t?st prov:generatedAtTime ?tval ;\n`;
        q+= '\t\t\topm:valueAtState ?value .\n';
        q+= '\t\t\tOPTIONAL{?st opm:expression ?expression .}\n';
        q+= '\t\t\tOPTIONAL{?st prov:wasDerivedFrom ?dependencies .}\n';
        q+= '\t}\n'
        q+= '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q+= this.getHost();
        q+= '\t#CREATE STATE URI\n';
        q+= '\tBIND(URI(CONCAT(STR(?http), "/", STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q+= '\tBIND(now() AS ?now)\n'

        q+= '}';
        return q;
    }

    /**
     * OTHER
     */
    listDeleted(): string {
        var q = '';
        q+= 'PREFIX  opm: <https://w3id.org/opm#>\n'
        q+= 'PREFIX  prov: <http://www.w3.org/ns/prov#>\n'
        q+= 'SELECT ?property (?t as ?timestamp) ?deletedBy\n';
        q+= 'WHERE {\n';
        q+= '\tGRAPH ?g {\n';
        
        //Get latest state
        q+= `\t#GET LATEST STATE\n`;
        q+= `\t{ SELECT ?property (MAX(?_t) AS ?t) WHERE {\n`;
        q+= `\t\tGRAPH ?g {\n`;
        q+= `\t\t\t?property opm:hasState/prov:generatedAtTime ?_t .\n`;
        q+= '\t\t}\n';
        q+= '\t} GROUP BY ?property }\n';

        q+= '\t#GET DATA\n'
        q+= '\t\t?property opm:hasState ?state .\n';
        q+= '\t\t?state prov:generatedAtTime ?t ;\n';
        q+= '\t\t\topm:deleted ?del .\n';
        q+= '\t\tOPTIONAL{ ?state prov:wasAttributedTo ?deletedBy }\n'
        q+= '\t\tFILTER(?del = true)\n';
        q+= '\t}\n';
        q+= '}';
        return q;
    }

    getHost(): string {
        var q = '';
        q+='\t#EXTRACT HOST URI\n';
        q+='\tBIND(IF(CONTAINS(STR(?propertyURI), "https://"), "https://", "http://") AS ?http)\n';
        q+='\tBIND(STRAFTER(STR(?propertyURI), STR(?http)) AS ?substr1)\n';
        q+='\tBIND(STRAFTER(STR(?substr1), "/") AS ?substr2)\n';
        q+='\tBIND(STRBEFORE(STR(?substr1), "/") AS ?host)\n';
        q+='\tBIND(STRBEFORE(STR(?substr2), "/") AS ?db)\n';
        return q;
    }
}
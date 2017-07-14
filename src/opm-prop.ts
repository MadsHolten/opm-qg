import { IProp } from "./interfaces";
import * as _ from "underscore";
import * as _s from "underscore.string";

export class OPMProp {
    private input: IProp;
    private err: string;

    constructor(input: IProp) {
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
        if(!_.contains(prefixes, 'rdfs')){
            this.input.prefixes.push({prefix: 'rdfs', uri: 'http://www.w3.org/2000/01/rdf-schema#'});
        }
        if(!_.contains(prefixes, 'opm')){
            this.input.prefixes.push({prefix: 'opm', uri: 'https://w3id.org/opm#'});
        }
        //Remove backslash at end of hostURI
        this.input.hostURI ? this.input.hostURI.replace(/\/$/, "") : null;
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

    //Create property where it doesn't already exist
    postProp(): string{
        //Retrieve and process variables
        var prefixes = this.input.prefixes;
        var resource = this.input.resourceURI;
        var property = this.input.value.property;
        var value = this.input.value.value;
        var unit = this.input.value.unit;
        var datatype = this.input.value.datatype;
        var hostURI = this.input.hostURI;
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
        q+= `\tBIND(URI(CONCAT("${hostURI}", "/Property/", ?guid)) AS ?propertyURI)\n`;
        q+= `\tBIND(URI(CONCAT("${hostURI}", "/State/", ?guid)) AS ?stateURI)\n`;
        q+= `\tBIND(now() AS ?now)\n`;
        q+= '}\n'
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Update property
    putProp(): string{
        //Retrieve and process variables
        var prefixes = this.input.prefixes;
        var resource = this.input.resourceURI;
        var property = this.input.value.property;
        var value = this.input.value.value;
        var unit = this.input.value.unit;
        var datatype = this.input.value.datatype;
        var hostURI = this.input.hostURI;
        var pattern = this.input.pattern;
        var resourceURI = this.input.resourceURI;

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }

        //Only makes an update if the value is different from the last evaluation
        q+= `CONSTRUCT
              {
                ?propertyURI opm:hasState ?stateURI .
                ?stateURI opm:valueAtState ?val ;
                               prov:generatedAtTime ?now .
              }
             WHERE {
              {SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE { 
                  GRAPH ?g {
                      ${resourceURI} ${property} ?propertyURI . 
                      ?propertyURI opm:hasState ?eval . 
                      ?eval prov:generatedAtTime ?_t . \n`;
        q+= pattern ? pattern+'\n' : '\n';
        q+=  `} } GROUP BY ?propertyURI }
              GRAPH ?g { 
                  ${resourceURI} ${property} ?propertyURI .
                  ?propertyURI opm:hasState [ prov:generatedAtTime ?t ;
                                                 opm:valueAtState ?old_val ] .
                  FILTER(strbefore(str(?old_val), " ") != str(${value}))
              }
              BIND(strdt(concat(str(${value}), " ${unit}"), ${datatype}) AS ?val)
              BIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)
              BIND(URI(CONCAT("${hostURI}", "/State/", ?guid)) AS ?stateURI)
              BIND(now() AS ?now)
             }`
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Get a single property
    getProp(): string {
        var prefixes = this.input.prefixes;
        var resource = this.input.resourceURI;
        var returnResource = this.input.resourceURI == '?resource' ? true : false;
        var property = this.input.propertyURI;
        var latest = this.input.latest;
        

        if(!property) this.err = "Please specify a propertyURI";

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }
        q+= `SELECT ?value `;
        q+= latest ? '(?ts AS ?timestamp) ' : '(MAX(?ts) AS ?timestamp) ';
        q+= returnResource ? '?resource ' : ' ';
        q+= `WHERE {
                GRAPH ?g { `;
        q+= latest ? `{ SELECT (MAX(?t) AS ?ts) WHERE {
                        ${resource} ${property} ?prop .
                        ?prop opm:hasState/prov:generatedAtTime ?t .
                      } GROUP BY ?prop } \n` :  '';
        q+= `${resource} ${property} ?prop .
             ?prop opm:hasState [ prov:generatedAtTime ?ts ; 
                                     opm:valueAtState ?value ] . } } `; 
        if(!latest){
            q+=`GROUP BY ?value `
            q+= returnResource ? '?resource' : '';
        }
        if(this.err){q = 'Error: '+this.err;}
        return q;
    }

    //Get all properties
    getProps(): string {
        var prefixes = this.input.prefixes;
        var resource = this.input.resourceURI ? `${this.input.resourceURI}` : '?resource';
        var strLang = this.input.language;
        var evalPath: string = '';

        var q: string = '';
        //Define prefixes
        for(var i in prefixes){
            q+= `PREFIX  ${prefixes[i].prefix}: <${prefixes[i].uri}> \n`;
        }

        q+= `SELECT ?resource ?property ?value ?lastUpdated ?g ?uri ?evaluation ?label `;
        q+= `WHERE { GRAPH ?g {
                {
                  SELECT ?property (MAX(?timestamp) AS ?lastUpdated)
                  WHERE {
                    ${resource} ?property [ opm:hasState [ prov:generatedAtTime ?timestamp ] ] .
                  }
                  GROUP BY ?property
                }
            OPTIONAL{ GRAPH ?gy {?property rdfs:label ?label}
                FILTER(lang(?label)="${strLang}")
            }
            ?resource ?property ?uri .
            ?uri opm:hasState ?evaluation .
            ?evaluation prov:generatedAtTime ?lastUpdated ; 
                        opm:valueAtState ?value .
        }}`;

        return q;
    }
}
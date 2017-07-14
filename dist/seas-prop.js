"use strict";
var _ = require("underscore");
var _s = require("underscore.string");
var SeasProp = (function () {
    function SeasProp(input) {
        this.input = input;
        //Add predefined prefixes
        var prefixes = _.pluck(this.input.prefixes, 'prefix');
        if (!this.input.prefixes) {
            this.input.prefixes = [];
        }
        ;
        if (!_.contains(prefixes, 'rdf')) {
            this.input.prefixes.push({ prefix: 'rdf', uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' });
        }
        if (!_.contains(prefixes, 'xsd')) {
            this.input.prefixes.push({ prefix: 'xsd', uri: 'http://www.w3.org/2001/XMLSchema#' });
        }
        if (!_.contains(prefixes, 'seas')) {
            this.input.prefixes.push({ prefix: 'seas', uri: 'https://w3id.org/seas/' });
        }
        if (!_.contains(prefixes, 'prov')) {
            this.input.prefixes.push({ prefix: 'prov', uri: 'http://www.w3.org/ns/prov#' });
        }
        if (!_.contains(prefixes, 'rdfs')) {
            this.input.prefixes.push({ prefix: 'rdfs', uri: 'http://www.w3.org/2000/01/rdf-schema#' });
        }
        //Remove backslash at end of hostURI
        this.input.hostURI ? this.input.hostURI.replace(/\/$/, "") : null;
        //datatype defaults to xsd:string
        if (this.input.value) {
            this.input.value.datatype = this.input.value.datatype ? this.input.value.datatype : 'xsd:string';
            //PropertyURI can be either prefixed or as a regular URI
            if (this.input.value.property) {
                var propertyURI = this.input.value.property;
                this.input.value.property = _s.startsWith(propertyURI, 'http') ? "<" + propertyURI + ">" : "" + propertyURI;
            }
        }
        //If no resource URI is specified, some pattern must exist
        if (!this.input.resourceURI) {
            if (!this.input.pattern && !this.input.propertyURI) {
                this.err = "When no resourceURI is specified a pattern must exist!";
            }
            else {
                this.input.resourceURI = '?resource';
                //Clean pattern
                var str = this.input.pattern;
                str = _s.clean(str); //Remove unnecessary spaces etc.
                str = _s.endsWith(str, ".") ? str + ' ' : str + ' . '; //Make sure it ends with a dot and a space
                this.input.pattern = str;
            }
        }
        else {
            this.input.resourceURI = "<" + this.input.resourceURI + ">";
        }
        //PropertyURI can be either prefixed or as a regular URI
        if (this.input.propertyURI) {
            var propertyURI = this.input.propertyURI;
            this.input.propertyURI = _s.startsWith(propertyURI, 'http') ? "<" + propertyURI + ">" : "" + propertyURI;
        }
    }
    //Create property where it doesn't already exist
    SeasProp.prototype.postProp = function () {
        //Retrieve and process variables
        var prefixes = this.input.prefixes;
        var resource = this.input.resourceURI;
        var property = this.input.value.property;
        var value = this.input.value.value;
        var unit = this.input.value.unit;
        var datatype = this.input.value.datatype;
        var hostURI = this.input.hostURI;
        var resourceURI = this.input.resourceURI;
        if (resourceURI == '?resource') {
            var pattern = "{ SELECT * WHERE { GRAPH ?g {" + this.input.pattern + "} }}";
        }
        else {
            var pattern = "{ SELECT * WHERE { GRAPH ?g {" + resourceURI + " ?p ?o} } LIMIT 1}";
        }
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        q += "CONSTRUCT\n              {\n                " + resourceURI + " " + property + " ?propertyURI .\n                ?propertyURI seas:evaluation ?evaluationURI .\n                ?evaluationURI seas:evaluatedValue ?val ;\n                               prov:generatedAtTime ?now .\n              }\n             WHERE {\n              " + pattern + "\n              MINUS\n              { GRAPH ?g\n                { " + resourceURI + " " + property + "/seas:evaluation ?eval }\n              }\n              BIND(strdt(concat(str(" + value + "), \" " + unit + "\"), " + datatype + ") AS ?val)\n              BIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n              BIND(URI(CONCAT(\"" + hostURI + "\", \"/Property/\", ?guid)) AS ?propertyURI)\n              BIND(URI(CONCAT(\"" + hostURI + "\", \"/Evaluation/\", ?guid)) AS ?evaluationURI)\n              BIND(now() AS ?now)\n             }";
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Update property
    SeasProp.prototype.putProp = function () {
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
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        //Only makes an update if the value is different from the last evaluation
        q += "CONSTRUCT\n              {\n                ?propertyURI seas:evaluation ?evaluationURI .\n                ?evaluationURI seas:evaluatedValue ?val ;\n                               prov:generatedAtTime ?now .\n              }\n             WHERE {\n              {SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE { \n                  GRAPH ?g {\n                      " + resourceURI + " " + property + " ?propertyURI . \n                      ?propertyURI seas:evaluation ?eval . \n                      ?eval prov:generatedAtTime ?_t . \n";
        q += pattern ? pattern + '\n' : '\n';
        q += "} } GROUP BY ?propertyURI }\n              GRAPH ?g { \n                  " + resourceURI + " " + property + " ?propertyURI .\n                  ?propertyURI seas:evaluation [ prov:generatedAtTime ?t ;\n                                                 seas:evaluatedValue ?old_val ] .\n                  FILTER(strbefore(str(?old_val), \" \") != str(" + value + "))\n              }\n              BIND(strdt(concat(str(" + value + "), \" " + unit + "\"), " + datatype + ") AS ?val)\n              BIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n              BIND(URI(CONCAT(\"" + hostURI + "\", \"/Evaluation/\", ?guid)) AS ?evaluationURI)\n              BIND(now() AS ?now)\n             }";
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Get a single property
    SeasProp.prototype.getProp = function () {
        var prefixes = this.input.prefixes;
        var resource = this.input.resourceURI;
        var returnResource = this.input.resourceURI == '?resource' ? true : false;
        var property = this.input.propertyURI;
        var latest = this.input.latest;
        if (!property)
            this.err = "Please specify a propertyURI";
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        q += "SELECT ?value ";
        q += latest ? '(?ts AS ?timestamp) ' : '(MAX(?ts) AS ?timestamp) ';
        q += returnResource ? '?resource ' : ' ';
        q += "WHERE {\n                GRAPH ?g { ";
        q += latest ? "{ SELECT (MAX(?t) AS ?ts) WHERE {\n                        " + resource + " " + property + " ?prop .\n                        ?prop seas:evaluation/prov:generatedAtTime ?t .\n                      } GROUP BY ?prop } \n" : '';
        q += resource + " " + property + " ?prop .\n             ?prop seas:evaluation [ prov:generatedAtTime ?ts ; \n                                     seas:evaluatedValue ?value ] . } } ";
        if (!latest) {
            q += "GROUP BY ?value ";
            q += returnResource ? '?resource' : '';
        }
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Get all properties
    SeasProp.prototype.getProps = function () {
        var prefixes = this.input.prefixes;
        var resource = this.input.resourceURI ? "" + this.input.resourceURI : '?resource';
        var strLang = this.input.language;
        var evalPath = '';
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        q += "SELECT ?resource ?property ?value ?lastUpdated ?g ?uri ?evaluation ?label ";
        q += "WHERE { GRAPH ?g {\n                {\n                  SELECT ?property (MAX(?timestamp) AS ?lastUpdated)\n                  WHERE {\n                    " + resource + " ?property [ seas:evaluation [ prov:generatedAtTime ?timestamp ] ] .\n                  }\n                  GROUP BY ?property\n                }\n            OPTIONAL{ GRAPH ?gy {?property rdfs:label ?label}\n                FILTER(lang(?label)=\"" + strLang + "\")\n            }\n            ?resource ?property ?uri .\n            ?uri seas:evaluation ?evaluation .\n            ?evaluation prov:generatedAtTime ?lastUpdated ; \n                        seas:evaluatedValue ?value .\n        }}";
        return q;
    };
    return SeasProp;
}());
exports.SeasProp = SeasProp;

"use strict";
var _ = require("underscore");
var _s = require("underscore.string");
var OPMProp = (function () {
    function OPMProp(input) {
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
        if (!_.contains(prefixes, 'opm')) {
            this.input.prefixes.push({ prefix: 'opm', uri: 'https://w3id.org/opm#' });
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
    /**
     * BY RESOURCE
     */
    //Create property for a resource where it doesn't already exist
    OPMProp.prototype.postResourceProp = function () {
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
        q += 'CONSTRUCT {\n';
        q += "\t" + resourceURI + " " + property + " ?propertyURI .\n";
        q += '\t?propertyURI opm:hasState ?stateURI .\n';
        q += '\t?stateURI opm:valueAtState ?val ;\n';
        q += '\t\tprov:generatedAtTime ?now .\n';
        q += '}\n';
        q += 'WHERE {\n';
        q += "\t" + pattern + "\n";
        q += '\tMINUS {\n';
        q += '\t\tGRAPH ?g {\n';
        q += "\t\t\t" + resourceURI + " " + property + "/opm:hasState ?eval .\n";
        q += '\t\t}\n';
        q += '\t}\n';
        q += "\tBIND(strdt(concat(str(" + value + "), \" " + unit + "\"), " + datatype + ") AS ?val)\n";
        q += "\tBIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n";
        q += "\tBIND(URI(CONCAT(\"" + hostURI + "\", \"/Property/\", ?guid)) AS ?propertyURI)\n";
        q += "\tBIND(URI(CONCAT(\"" + hostURI + "\", \"/State/\", ?guid)) AS ?stateURI)\n";
        q += "\tBIND(now() AS ?now)\n";
        q += '}\n';
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Update resource property
    OPMProp.prototype.putResourceProp = function () {
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
        q += "CONSTRUCT\n              {\n                ?propertyURI opm:hasState ?stateURI .\n                ?stateURI opm:valueAtState ?val ;\n                               prov:generatedAtTime ?now .\n              }\n             WHERE {\n              {SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE { \n                  GRAPH ?g {\n                      " + resourceURI + " " + property + " ?propertyURI . \n                      ?propertyURI opm:hasState ?eval . \n                      ?eval prov:generatedAtTime ?_t . \n";
        q += pattern ? pattern + '\n' : '\n';
        q += "} } GROUP BY ?propertyURI }\n              GRAPH ?g { \n                  " + resourceURI + " " + property + " ?propertyURI .\n                  ?propertyURI opm:hasState [ prov:generatedAtTime ?t ;\n                                                 opm:valueAtState ?old_val ] .\n                  FILTER(strbefore(str(?old_val), \" \") != str(" + value + "))\n              }\n              BIND(strdt(concat(str(" + value + "), \" " + unit + "\"), " + datatype + ") AS ?val)\n              BIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n              BIND(URI(CONCAT(\"" + hostURI + "\", \"/State/\", ?guid)) AS ?stateURI)\n              BIND(now() AS ?now)\n             }";
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Get a single property of a resource
    OPMProp.prototype.getResourceProp = function () {
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
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
        }
        q += "SELECT ?value ";
        q += latest ? '(?ts AS ?timestamp) ' : '(MAX(?ts) AS ?timestamp) ';
        q += returnResource ? '?resource\n' : '\n';
        q += 'WHERE {\n';
        q += '\tGRAPH ?g {\n';
        if (latest) {
            q += "\t\t{ SELECT (MAX(?t) AS ?ts) WHERE {\n";
            q += "\t\t\t" + resource + " " + property + " ?prop .\n";
            q += "\t\t\t?prop opm:hasState/prov:generatedAtTime ?t .\n";
            q += '\t\t} GROUP BY ?prop }\n';
        }
        q += "\t\t" + resource + " " + property + " ?prop .\n";
        q += "\t\t?prop opm:hasState [ prov:generatedAtTime ?ts ;\n";
        q += "\t\t\topm:valueAtState ?value ] .\n";
        q += "\t}\n";
        q += "}";
        if (!latest) {
            q += " GROUP BY ?value ";
            q += returnResource ? '?resource' : '';
        }
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Get all resource properties
    OPMProp.prototype.getResourceProps = function () {
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
        q += "WHERE { GRAPH ?g {\n                {\n                  SELECT ?property (MAX(?timestamp) AS ?lastUpdated)\n                  WHERE {\n                    " + resource + " ?property [ opm:hasState [ prov:generatedAtTime ?timestamp ] ] .\n                  }\n                  GROUP BY ?property\n                }\n            OPTIONAL{ GRAPH ?gy {?property rdfs:label ?label}\n                FILTER(lang(?label)=\"" + strLang + "\")\n            }\n            ?resource ?property ?uri .\n            ?uri opm:hasState ?evaluation .\n            ?evaluation prov:generatedAtTime ?lastUpdated ; \n                        opm:valueAtState ?value .\n        }}";
        return q;
    };
    /**
     * BY PROPERTY
     */
    //Get a single property
    OPMProp.prototype.getProp = function () {
        var prefixes = this.input.prefixes;
        var propertyURI = this.input.propertyURI;
        var latest = this.input.latest;
        if (!propertyURI)
            this.err = "Please specify a propertyURI";
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
        }
        q += "SELECT ?value ?timestamp\n";
        q += 'WHERE {\n';
        q += '\tGRAPH ?g {\n';
        if (latest) {
            q += "\t\t{ SELECT (MAX(?t) AS ?timestamp) WHERE {\n";
            q += "\t\t\t" + propertyURI + " opm:hasState ?state .\n";
            q += "\t\t\t?state prov:generatedAtTime ?t ;\n";
            q += '\t\t\t^opm:hasState ?propertyURI .\n';
            q += '\t\t} GROUP BY ?propertyURI }\n';
        }
        q += "\t\t" + propertyURI + " opm:hasState ?state .\n";
        q += '\t\t?state prov:generatedAtTime ?timestamp ;\n';
        q += "\t\t\topm:valueAtState ?value ;\n";
        q += '\t\t\t^opm:hasState ?propertyURI .\n';
        q += "\t}\n";
        q += "}";
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Delete a property
    OPMProp.prototype.deleteProp = function () {
        var propertyURI = this.input.propertyURI;
        var hostURI = this.input.hostURI;
        var prefixes = this.input.prefixes;
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        q += 'CONSTRUCT {\n';
        q += '\t?propertyURI opm:hasState ?stateURI .\n';
        q += '\t?stateURI prov:generatedAtTime ?now ;\n';
        q += '\t\topm:deleted "true"^^xsd:boolean .\n';
        q += '}\n';
        q += 'WHERE {\n';
        //Get latest state
        q += "\t#GET LATEST STATE\n";
        q += "\t{ SELECT (MAX(?_t) AS ?t) WHERE {\n";
        q += "\t\tGRAPH ?g {\n";
        q += "\t\t\t" + propertyURI + " opm:hasState/prov:generatedAtTime ?_t .\n";
        q += '\t\t}\n';
        q += '\t} }\n';
        q += "\t#A STATE MUST EXIST AND IT MUST NOT BE DELETED ALREADY\n";
        q += '\tGRAPH ?g {\n';
        q += "\t\t" + propertyURI + " opm:hasState ?state .\n";
        q += "\t\t?state prov:generatedAtTime ?t ;\n";
        q += '\t\t\t^opm:hasState ?propertyURI .\n';
        q += '\t\tOPTIONAL{\n';
        q += '\t\t\t?state opm:deleted ?del\n';
        q += '\t\t\tFILTER(?del != "true")\n';
        q += '\t\t}\n';
        q += '\t}\n';
        q += '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q += "\tBIND(URI(CONCAT(\"" + hostURI + "\", \"/State/\", ?guid)) AS ?stateURI)\n";
        q += '\tBIND(now() AS ?now)\n';
        q += '}';
        return q;
    };
    //Restore a deleted property
    OPMProp.prototype.restoreProp = function () {
        var propertyURI = this.input.propertyURI;
        var prefixes = this.input.prefixes;
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        q += 'CONSTRUCT {\n';
        q += '\t?propertyURI opm:hasState ?stateURI .\n';
        q += '\t?stateURI opm:valueAtState ?val ;\n';
        q += '\t\tprov:generatedAtTime ?now .\n';
        q += '}\n';
        q += 'WHERE {\n';
        //Get latest state
        q += "\t#GET LATEST STATE\n";
        q += "\t{ SELECT (MAX(?_t) AS ?t) WHERE {\n";
        q += "\t\tGRAPH ?g {\n";
        q += "\t\t\t" + propertyURI + " opm:hasState/prov:generatedAtTime ?_tc\n";
        q += '\t\t}\n';
        q += '\t} }\n';
        q += '}';
        return q;
    };
    return OPMProp;
}());
exports.OPMProp = OPMProp;

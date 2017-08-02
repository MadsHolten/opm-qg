"use strict";
var _ = require("underscore");
var _s = require("underscore.string");
var OPMProp = (function () {
    function OPMProp(input) {
        this.input = input;
        if (input) {
            //Default query type is construct
            this.queryType = this.input.queryType ? this.input.queryType : 'construct';
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
            //datatype defaults to xsd:string
            if (this.input.value) {
                this.input.value.datatype = this.input.value.datatype ? this.input.value.datatype : 'xsd:string';
                //PropertyURI can be either prefixed or as a regular URI
                if (this.input.value.property) {
                    var propertyURI = this.input.value.property;
                    this.input.value.property = _s.startsWith(propertyURI, 'http') ? "<" + propertyURI + ">" : "" + propertyURI;
                }
            }
            //If no FoI URI is specified, some pattern must exist
            if (!this.input.foiURI) {
                if (!this.input.pattern && !this.input.propertyURI) {
                    this.err = "When no foiURI is specified a pattern must exist!";
                }
                else {
                    this.input.foiURI = '?foi';
                    //Clean pattern
                    var str = this.input.pattern;
                    str = _s.clean(str); //Remove unnecessary spaces etc.
                    str = _s.endsWith(str, ".") ? str + ' ' : str + ' . '; //Make sure it ends with a dot and a space
                    this.input.pattern = str;
                }
            }
            else {
                this.input.foiURI = "<" + this.input.foiURI + ">";
            }
            //PropertyURI can be either prefixed or as a regular URI
            if (this.input.propertyURI) {
                var propertyURI = this.input.propertyURI;
                this.input.propertyURI = _s.startsWith(propertyURI, 'http') ? "<" + propertyURI + ">" : "" + propertyURI;
            }
            if (this.input.userURI) {
                var userURI = this.input.userURI;
                this.input.userURI = "<" + userURI + ">";
            }
        }
        else {
            this.queryType = 'construct';
        }
    }
    /**
     * BY FoI
     */
    //Create property for a FoI where it doesn't already exist
    OPMProp.prototype.postFoIProp = function () {
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
        if (foiURI == '?foi') {
            var pattern = "{ SELECT * WHERE { GRAPH ?g {" + this.input.pattern + "} }}";
        }
        else {
            var pattern = "{ SELECT * WHERE { GRAPH ?g {" + foiURI + " ?p ?o} } LIMIT 1}";
        }
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        q += 'CONSTRUCT {\n';
        q += "\t" + foiURI + " " + property + " ?propertyURI .\n";
        q += '\t?propertyURI a opm:Property ;\n';
        q += '\t\trdfs:label "Typed Property"@en ;\n';
        q += '\t\topm:hasState ?stateURI .\n';
        if (userURI) {
            q += "\t?stateURI prov:wasAttributedTo " + userURI + " .\n";
        }
        if (comment) {
            q += "\t?stateURI rdfs:comment \"" + comment + "\"^^xsd:string .\n";
        }
        q += '\t?stateURI a opm:State ;\n';
        q += '\t\trdfs:label "Typed State"@en ;\n';
        // a opm:Assumption? opm:Confirmed?
        q += '\t\topm:valueAtState ?val ;\n';
        q += '\t\tprov:generatedAtTime ?now .\n';
        q += '}\n';
        q += 'WHERE {\n';
        q += "\t" + pattern + "\n";
        q += '\tMINUS {\n';
        q += '\t\tGRAPH ?g {\n';
        q += "\t\t\t" + foiURI + " " + property + "/opm:hasState ?state .\n";
        q += '\t\t}\n';
        q += '\t}\n';
        q += "\tBIND(strdt(concat(str(" + value + "), \" " + unit + "\"), " + datatype + ") AS ?val)\n";
        q += "\tBIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n";
        q += this.getHost(foiURI);
        q += '\t#CREATE STATE AND PROPERTY URI´s\n';
        q += '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q += '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/Property/", ?guid)) AS ?propertyURI)\n';
        q += "\tBIND(now() AS ?now)\n";
        q += '}\n';
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Update FoI property
    OPMProp.prototype.putFoIProp = function () {
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
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
        }
        //Only makes an update if the value is different from the last evaluation
        q += 'CONSTRUCT {\n';
        q += '\t?propertyURI opm:hasState ?stateURI .\n';
        if (userURI) {
            q += "\t?stateURI prov:wasAttributedTo " + userURI + " .\n";
        }
        if (comment) {
            q += "\t?stateURI rdfs:comment \"" + comment + "\"^^xsd:string .\n";
        }
        q += '\t?stateURI a opm:State ;\n';
        // a opm:Assumption? opm:Confirmed?
        q += '\t\trdfs:label "Typed State"@en ;\n';
        q += '\t\topm:valueAtState ?val ;\n';
        q += '\t\tprov:generatedAtTime ?now ;\n';
        q += '\t\topm:error ?error .\n';
        q += '}\n';
        q += 'WHERE {\n';
        q += '\t#GET LATEST STATE\n';
        q += '\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n';
        q += '\t\tGRAPH ?g {\n';
        q += "\t\t\t" + foiURI + " " + property + " ?propertyURI .\n";
        q += '\t\t\t?propertyURI opm:hasState ?state .\n';
        q += '\t\t\t?state prov:generatedAtTime ?_t .\n';
        q += pattern ? "\t\t\t" + pattern + "\n" : '';
        q += '\t\t}\n';
        q += '\t} GROUP BY ?propertyURI }\n';
        q += '\t\t#GET DATA - VALUE SHOULD BE DIFFERENT FROM THE PREVIOUS\n';
        q += '\t\tGRAPH ?g {\n';
        q += "\t\t\t" + foiURI + " " + property + " ?propertyURI .\n";
        q += "\t\t\t?propertyURI opm:hasState [ prov:generatedAtTime ?t ;\n";
        q += "\t\t\t\topm:valueAtState ?old_val ] .\n";
        q += "\t\t\tFILTER(strbefore(str(?old_val), \" \") != str(" + value + "))\n";
        q += '\t\t}\n';
        q += "\tBIND(strdt(concat(str(" + value + "), \" " + unit + "\"), " + datatype + ") AS ?val)\n";
        q += '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q += this.getHost(foiURI);
        q += '\t#CREATE STATE URI´s\n';
        q += '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q += '\tBIND(now() AS ?now)\n';
        //q+= '\t#ERRORS\n';
        //q+= `\tBIND(IF(strbefore(str(?old_val), " ") = str(70), "The specified value is the same as the previous", "") AS ?error)\n`;
        q += '}';
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Get a single property of a foi
    OPMProp.prototype.getFoIProp = function () {
        var prefixes = this.input.prefixes;
        var foi = this.input.foiURI;
        var returnFoI = this.input.foiURI == '?foi' ? true : false;
        var property = this.input.propertyURI;
        var latest = this.input.latest;
        if (!property)
            this.err = "Please specify a propertyURI";
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
        }
        q += "SELECT ?value ?deleted ";
        q += latest ? '(?ts AS ?timestamp) ' : '(MAX(?ts) AS ?timestamp) ';
        q += returnFoI ? '?foi\n' : '\n';
        q += 'WHERE {\n';
        q += '\tGRAPH ?g {\n';
        if (latest) {
            q += "\t\t{ SELECT (MAX(?t) AS ?ts) WHERE {\n";
            q += "\t\t\t" + foi + " " + property + " ?prop .\n";
            q += "\t\t\t?prop opm:hasState/prov:generatedAtTime ?t .\n";
            q += '\t\t} GROUP BY ?prop }\n';
        }
        q += "\t\t" + foi + " " + property + " ?prop .\n";
        q += "\t\t?prop opm:hasState ?state .\n";
        q += "\t\t?state prov:generatedAtTime ?ts ;\n";
        q += '\t\tOPTIONAL{?state opm:valueAtState ?value .}\n';
        q += '\t\tOPTIONAL{?state opm:deleted ?deleted .}\n';
        q += "\t}\n";
        q += "}";
        if (!latest) {
            q += " GROUP BY ?value ?deleted";
            q += returnFoI ? '?foi' : '';
        }
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Get all FoI properties
    OPMProp.prototype.getFoIProps = function () {
        var prefixes = (this.input && this.input.prefixes) ? this.input.prefixes : undefined;
        var foi = (this.input && this.input.foiURI) ? "" + this.input.foiURI : '?foi';
        var strLang = (this.input && this.input.language) ? this.input.language : 'en';
        var evalPath = '';
        var q = '';
        //Define prefixes
        if (prefixes) {
            for (var i in prefixes) {
                q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
            }
        }
        else {
            q += 'PREFIX seas: <https://w3id.org/seas/>\n';
            q += 'PREFIX opm: <https://w3id.org/opm#>\n';
            q += 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n';
            q += 'PREFIX prov: <http://www.w3.org/ns/prov#>\n';
        }
        q += "SELECT ?foi ?property ?value ?lastUpdated ?g ?uri ?state ?label ?deleted ";
        q += "WHERE {\n";
        q += "\tGRAPH ?g {\n";
        q += "\t\t{ SELECT ?property (MAX(?timestamp) AS ?lastUpdated) WHERE {\n";
        q += "\t\t\t" + foi + " ?property ?propertyURI .\n";
        q += "\t\t\t?propertyURI opm:hasState ?state .\n";
        q += "\t\t\t?state prov:generatedAtTime ?timestamp .\n";
        q += "\t\t} GROUP BY ?property }\n";
        q += "\t\tOPTIONAL{\n";
        q += "\t\t\tGRAPH ?gy {\n";
        q += "\t\t\t\t?property rdfs:label ?label\n";
        q += "\t\t}\t\n";
        q += "\t\t\tFILTER(lang(?label)=\"" + strLang + "\")\n";
        q += '\t\t}\n';
        q += '\t\t?foi ?property ?uri .\n';
        q += '\t\t?uri opm:hasState ?state .\n';
        q += '\t\t?state prov:generatedAtTime ?lastUpdated .\n';
        q += '\t\tOPTIONAL{?state opm:valueAtState ?value .}\n';
        q += '\t\tOPTIONAL{?state opm:deleted ?deleted .}\n';
        q += "\t\tFILTER(?foi = " + foi + ")\n";
        q += '\t}\n';
        q += '}';
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
        q += "SELECT ?value ?timestamp ?deleted\n";
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
        q += '\t\t\t^opm:hasState ?propertyURI .\n';
        q += '\t\tOPTIONAL{?state opm:valueAtState ?value .}\n';
        q += '\t\tOPTIONAL{?state opm:deleted ?deleted .}\n';
        q += "\t}\n";
        q += "}";
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Update a property
    OPMProp.prototype.putProp = function () {
        //Retrieve and process variables
        var userURI = this.input.userURI;
        var comment = this.input.comment;
        var prefixes = this.input.prefixes;
        var propertyURI = this.input.propertyURI;
        var value = this.input.value.value;
        var unit = this.input.value.unit;
        var datatype = this.input.value.datatype;
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
        }
        //Only makes an update if the value is different from the last evaluation
        q += 'CONSTRUCT {\n';
        q += "\t" + propertyURI + " opm:hasState ?stateURI .\n";
        if (userURI) {
            q += "\t?stateURI prov:wasAttributedTo " + userURI + " .\n";
        }
        if (comment) {
            q += "\t?stateURI rdfs:comment \"" + comment + "\"^^xsd:string .\n";
        }
        q += '\t?stateURI a opm:State ;\n';
        // a opm:Assumption? opm:Confirmed?
        q += '\t\trdfs:label "Typed State"@en ;\n';
        q += '\t\topm:valueAtState ?val ;\n';
        q += '\t\tprov:generatedAtTime ?now ;\n';
        q += '\t\topm:error ?error .\n';
        q += '}\n';
        q += 'WHERE {\n';
        q += '\t#GET LATEST STATE\n';
        q += '\t{ SELECT ?state (MAX(?_t) AS ?t) WHERE {\n';
        q += '\t\tGRAPH ?g {\n';
        q += "\t\t\t" + propertyURI + " opm:hasState ?state .\n";
        q += '\t\t\t?state prov:generatedAtTime ?_t .\n';
        q += '\t\t}\n';
        q += '\t} GROUP BY ?state }\n';
        q += '\t\t#GET DATA - VALUE SHOULD BE DIFFERENT FROM THE PREVIOUS\n';
        q += '\t\tGRAPH ?g {\n';
        q += "\t\t\t?state prov:generatedAtTime ?t ;\n";
        q += "\t\t\t\topm:valueAtState ?old_val.\n";
        q += "\t\t\tFILTER(strbefore(str(?old_val), \" \") != str(" + value + "))\n";
        q += '\t\t}\n';
        q += "\tBIND(strdt(concat(str(" + value + "), \" " + unit + "\"), " + datatype + ") AS ?val)\n";
        q += '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q += this.getHost(propertyURI);
        q += '\t#CREATE STATE URI´s\n';
        q += '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q += '\tBIND(now() AS ?now)\n';
        //q+= '\t#ERRORS\n';
        //q+= `\tBIND(IF(strbefore(str(?old_val), " ") = str(70), "The specified value is the same as the previous", "") AS ?error)\n`;
        q += '}';
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Delete a property
    //Maybe make two - a force one that doesn't take dependencies and 
    //confirmed properties into account and a regular one that will not
    //delete properties other depend on or that are confirmed
    OPMProp.prototype.deleteProp = function () {
        var userURI = this.input.userURI;
        var comment = this.input.comment;
        var propertyURI = this.input.propertyURI;
        var prefixes = this.input.prefixes;
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        q += 'CONSTRUCT {\n';
        q += '\t?propertyURI opm:hasState ?stateURI .\n';
        if (userURI) {
            q += "\t?stateURI prov:wasAttributedTo " + userURI + " .\n";
        }
        if (comment) {
            q += "\t?stateURI rdfs:comment \"" + comment + "\"^^xsd:string .\n";
        }
        q += '\t?stateURI a opm:State , opm:Deleted ;\n';
        q += '\t\trdfs:label "Deleted State"@en ;\n';
        q += '\t\tprov:generatedAtTime ?now .\n';
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
        q += '\t\tMINUS { ?state a opm:Deleted }\n';
        //A confirmed property should not be deletable, right?
        //Especially not if people use it - so maybe make this restriction
        //q+= '\t\tMINUS { ?state a opm:Confirmed }\n';
        q += '\t}\n';
        q += '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q += this.getHost(propertyURI);
        q += '\t#CREATE STATE URI\n';
        q += '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q += '\tBIND(now() AS ?now)\n';
        q += '}';
        return q;
    };
    //Restore a deleted property
    OPMProp.prototype.restoreProp = function () {
        var userURI = this.input.userURI;
        var comment = this.input.comment;
        var propertyURI = this.input.propertyURI;
        var prefixes = this.input.prefixes;
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        q += 'CONSTRUCT {\n';
        q += '\t?propertyURI opm:hasState ?stateURI .\n';
        if (userURI) {
            q += "\t?stateURI prov:wasAttributedTo " + userURI + " .\n";
        }
        if (comment) {
            q += "\t?stateURI rdfs:comment \"" + comment + "\"^^xsd:string .\n";
        }
        q += '\t?stateURI a ?previousClasses ;\n';
        q += '\trdfs:label ?previousLabels ;\n';
        q += '\t\topm:valueAtState ?value ;\n';
        q += '\t\tprov:generatedAtTime ?now ;\n';
        q += '\t\topm:expression ?expression ;\n';
        q += '\t\tprov:wasDerivedFrom ?dependencies .\n';
        q += '}\n';
        q += 'WHERE {\n';
        q += '\tGRAPH ?g {\n';
        //Get latest state
        q += "\t\t#GET TIME OF LATEST STATE\n";
        q += "\t\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n";
        q += "\t\t\t" + propertyURI + " opm:hasState ?state .\n";
        q += "\t\t\t?state prov:generatedAtTime ?_t ;\n";
        q += "\t\t\t\t^opm:hasState ?propertyURI .\n";
        q += '\t\t} GROUP BY ?propertyURI }\n';
        //Make sure it is deleted and get data
        q += "\t\t#A STATE MUST EXIST AND IT SHOULD BE DELETED\n";
        q += "\t\t?propertyURI opm:hasState ?state .\n";
        q += "\t\t?state prov:generatedAtTime ?t ;\n";
        q += '\t\t\ta opm:Deleted .\n';
        //Get latest value
        q += "\t\t#GET TIME OF LAST VALUE\n";
        q += "\t\t{ SELECT ?propertyURI (MAX(?_t) AS ?tval) WHERE {\n";
        q += "\t\t\t?propertyURI opm:hasState ?st .\n";
        q += "\t\t\t?st prov:generatedAtTime ?_t ;\n";
        //Must have a value assigned
        q += "\t\t\t\topm:valueAtState ?val .\n";
        q += '\t\t} GROUP BY ?propertyURI }\n';
        //Get data
        q += "\t\t#GET DATA\n";
        q += "\t\t?st prov:generatedAtTime ?tval ;\n";
        q += '\t\t\topm:valueAtState ?value ;\n';
        q += '\t\t\ta ?previousClasses .\n';
        q += '\t\t\tOPTIONAL{?st rdfs:label ?previousLabels .}\n';
        q += '\t\t\tOPTIONAL{?st opm:expression ?expression .}\n';
        q += '\t\t\tOPTIONAL{?st prov:wasDerivedFrom ?dependencies .}\n';
        q += '\t}\n';
        q += '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q += this.getHost(propertyURI);
        q += '\t#CREATE STATE URI\n';
        q += '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q += '\tBIND(now() AS ?now)\n';
        q += '}';
        return q;
    };
    OPMProp.prototype.confirmProp = function () {
        var comment = this.input.comment;
        var propertyURI = this.input.propertyURI;
        var userURI = this.input.userURI;
        var prefixes = this.input.prefixes;
        if (!userURI)
            this.err = "A user must be atrributed to a confirmed value. Please specify a userURI";
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        q += 'CONSTRUCT {\n';
        q += '\t?propertyURI opm:hasState ?stateURI .\n';
        //Assign value directly to property when confirmed?
        //Mark property as confirmed?
        if (comment) {
            q += "\t?stateURI rdfs:comment \"" + comment + "\"^^xsd:string .\n";
        }
        q += '\t?stateURI a opm:State , opm:Confirmed ;\n';
        q += '\t\trdfs:label "Confirmed State"@en ;\n';
        q += '\t\topm:valueAtState ?value ;\n';
        q += '\t\tprov:generatedAtTime ?now ;\n';
        q += "\t\tprov:wasAttributedTo " + userURI + " .\n";
        q += '}\n';
        q += 'WHERE {\n';
        q += '\tGRAPH ?g {\n';
        //Get latest state
        q += "\t\t#GET LATEST STATE\n";
        q += "\t\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n";
        q += "\t\t\t" + propertyURI + " opm:hasState ?state .\n";
        q += "\t\t\t?state prov:generatedAtTime ?_t ;\n";
        q += "\t\t\t\t^opm:hasState ?propertyURI .\n";
        q += '\t\t} GROUP BY ?propertyURI }\n';
        //Make sure it is not deleted or confirmed already and get data
        q += "\t\t#A STATE MUST EXIST AND MUST NOT BE DELETED OR CONFIRMED\n";
        q += "\t\t?propertyURI opm:hasState ?state .\n";
        q += "\t\t?state prov:generatedAtTime ?t ;\n";
        q += "\t\t\topm:valueAtState ?value .\n";
        q += '\t\tMINUS { ?state a opm:Deleted }\n';
        q += '\t\tMINUS { ?state a opm:Confirmed }\n';
        //Omit derived values (these are confirmed when all arguments are confirmed)
        q += "\t\t#A DERIVED PROPERTY CAN'T BE CONFIRMED - ARGUMENTS ARE CONFIRMED\n";
        q += '\t\tMINUS { ?state a opm:Derived }\n';
        q += '\t\tMINUS { ?state prov:wasDerivedFrom ?dependencies }\n';
        q += '\t}\n';
        q += '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q += this.getHost(propertyURI);
        q += '\t#CREATE STATE URI\n';
        q += '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q += '\tBIND(now() AS ?now)\n';
        q += '}';
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    OPMProp.prototype.makeAssumption = function () {
        var propertyURI = this.input.propertyURI;
        var comment = this.input.comment;
        var userURI = this.input.userURI;
        var prefixes = this.input.prefixes;
        if (!userURI)
            this.err = "A user must be atrributed to an assumed value. Please specify a userURI";
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        q += 'CONSTRUCT {\n';
        q += '\t?propertyURI opm:hasState ?stateURI .\n';
        if (userURI) {
            q += "\t?stateURI prov:wasAttributedTo " + userURI + " .\n";
        }
        if (comment) {
            q += "\t?stateURI rdfs:comment \"" + comment + "\"^^xsd:string .\n";
        }
        q += '\t?stateURI a opm:State , opm:Assumption ;\n';
        q += '\t\trdfs:label "Assumption State"@en ;\n';
        q += '\t\topm:valueAtState ?value ;\n';
        q += '\t\tprov:generatedAtTime ?now .\n';
        q += '}\n';
        q += 'WHERE {\n';
        q += '\tGRAPH ?g {\n';
        //Get latest state
        q += "\t\t#GET LATEST STATE\n";
        q += "\t\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n";
        q += "\t\t\t" + propertyURI + " opm:hasState ?state .\n";
        q += "\t\t\t?state prov:generatedAtTime ?_t ;\n";
        q += "\t\t\t\t^opm:hasState ?propertyURI .\n";
        q += '\t\t} GROUP BY ?propertyURI }\n';
        //Make sure it is not deleted and get data
        q += "\t\t#A STATE MUST EXIST AND MUST NOT BE DELETED, CONFIRMED OR AN ASSUMPTION\n";
        q += "\t\t?propertyURI opm:hasState ?state .\n";
        q += "\t\t?state prov:generatedAtTime ?t ;\n";
        q += "\t\t\topm:valueAtState ?value .\n";
        q += '\t\tMINUS { ?state a opm:Deleted }\n';
        q += '\t\tMINUS { ?state a opm:Confirmed }\n';
        q += '\t\tMINUS { ?state a opm:Assumption }\n';
        //Omit derived values (these are confirmed when all arguments are confirmed)
        q += "\t\t#A DERIVED PROPERTY CAN'T BE MADE AN ASSUMPTION - ARGUMENTS ARE ASSUMPTIONS\n";
        q += '\t\tMINUS { ?state a opm:Derived }\n';
        q += '\t\tMINUS { ?state prov:wasDerivedFrom ?dependencies }\n';
        q += '\t}\n';
        q += '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q += this.getHost(propertyURI);
        q += '\t#CREATE STATE URI\n';
        q += '\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q += '\tBIND(now() AS ?now)\n';
        q += '}';
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    /**
     * OTHER
     */
    OPMProp.prototype.listDeleted = function () {
        var q = '';
        q += 'PREFIX  opm: <https://w3id.org/opm#>\n';
        q += 'PREFIX  prov: <http://www.w3.org/ns/prov#>\n';
        q += 'PREFIX  seas: <https://w3id.org/seas/>\n';
        q += 'PREFIX  sd: <http://www.w3.org/ns/sparql-service-description#>\n';
        if (this.queryType == 'construct') {
            q += 'CONSTRUCT {\n';
            q += '\t?property opm:hasState ?state ;\n';
            q += '\t\tseas:isPropertyOf ?foiURI ;\n';
            q += '\t\tsd:namedGraph ?g .\n';
            q += '\t?state prov:generatedAtTime ?t ;\n';
            q += '\t\tprov:wasAttributedTo ?deletedBy ;\n';
            q += '\t\trdfs:comment ?comment .\n';
            q += '}\n';
        }
        else {
            q += 'SELECT (?property as ?propertyURI) (?t as ?timestamp) ?deletedBy (?g as ?graphURI) ?foiURI\n';
        }
        q += 'WHERE {\n';
        q += '\tGRAPH ?g {\n';
        //Get latest state
        q += "\t#GET LATEST STATE\n";
        q += "\t{ SELECT ?property (MAX(?_t) AS ?t) WHERE {\n";
        q += "\t\tGRAPH ?g {\n";
        q += "\t\t\t?property opm:hasState/prov:generatedAtTime ?_t .\n";
        q += '\t\t}\n';
        q += '\t} GROUP BY ?property }\n';
        q += '\t#GET DATA\n';
        q += '\t\t?property opm:hasState ?state .\n';
        q += '\t\t?state a opm:Deleted ;\n';
        q += '\t\t\tprov:generatedAtTime ?t .\n';
        q += '\t\tOPTIONAL{ ?state prov:wasAttributedTo ?deletedBy }\n';
        q += '\t\tOPTIONAL{ ?state rdfs:comment ?comment }\n';
        q += "\t\t#FINDING THE FoI IS ONLY POSSIBLE WITH REASONING\n";
        q += "\t\tOPTIONAL { ?property seas:isPropertyOf ?foiURI . }\n";
        q += '\t}\n';
        q += '}';
        return q;
    };
    OPMProp.prototype.listAssumptions = function () {
        var q = '';
        q += 'PREFIX  opm: <https://w3id.org/opm#>\n';
        q += 'PREFIX  prov: <http://www.w3.org/ns/prov#>\n';
        q += 'PREFIX  seas: <https://w3id.org/seas/>\n';
        q += 'PREFIX  sd: <http://www.w3.org/ns/sparql-service-description#>\n';
        if (this.queryType == 'construct') {
            q += 'CONSTRUCT {\n';
            q += '\t?propertyURI opm:hasState ?state ;\n';
            q += '\t\tseas:isPropertyOf ?foiURI ;\n';
            q += '\t\tsd:namedGraph ?g .\n';
            q += '\t?state prov:generatedAtTime ?t ;\n';
            q += '\t\tprov:wasAttributedTo ?assumedBy ;\n';
            q += '\t\trdfs:comment ?comment .\n';
            q += '}\n';
        }
        else {
            q += 'SELECT ?propertyURI (?t as ?timestamp) ?assumedBy (?g as ?graphURI) ?foiURI\n';
        }
        q += 'WHERE {\n';
        q += '\tGRAPH ?g {\n';
        //Get latest state
        q += "\t#GET LATEST STATE\n";
        q += "\t{ SELECT ?propertyURI (MAX(?_t) AS ?t) WHERE {\n";
        q += "\t\tGRAPH ?g {\n";
        q += "\t\t\t?propertyURI opm:hasState/prov:generatedAtTime ?_t .\n";
        q += '\t\t}\n';
        q += '\t} GROUP BY ?propertyURI }\n';
        q += '\t#GET DATA\n';
        q += '\t\t?propertyURI opm:hasState ?state .\n';
        q += '\t\t?state a opm:Assumption ;\n';
        q += '\t\t\tprov:generatedAtTime ?t .\n';
        q += '\t\tOPTIONAL{ ?state prov:wasAttributedTo ?assumedBy }\n';
        q += '\t\tOPTIONAL{ ?state rdfs:comment ?comment }\n';
        q += "\t\t#FINDING THE FoI IS ONLY POSSIBLE WITH REASONING\n";
        q += "\t\tOPTIONAL { ?propertyURI seas:isPropertyOf ?foiURI . }\n";
        q += '\t\t#EXCLUDE DELETED\n';
        q += '\t\tMINUS { ?state a opm:Deleted }\n';
        q += '\t}\n';
        q += '}';
        return q;
    };
    OPMProp.prototype.listSubscribers = function () {
        var propertyURI = this.input.propertyURI;
        var q = '';
        q += 'PREFIX  opm: <https://w3id.org/opm#>\n';
        q += 'PREFIX  prov: <http://www.w3.org/ns/prov#>\n';
        q += 'PREFIX  seas: <https://w3id.org/seas/>\n';
        q += 'PREFIX  sd: <http://www.w3.org/ns/sparql-service-description#>\n';
        if (this.queryType == 'construct') {
            q += 'CONSTRUCT {\n';
            q += '\t?origin opm:hasSubscriber ?propertyURI .\n';
            q += '\t?propertyURI sd:namedGraph ?g2 ;\n';
            q += '\t\tseas:isPropertyOf ?foiURI .\n';
            q += '}\n';
        }
        else {
            q += 'SELECT DISTINCT ?propertyURI (?g2 as ?graphURI) ?foiURI\n';
        }
        q += 'WHERE {\n';
        q += '\tGRAPH ?g {\n';
        q += "\t\t" + propertyURI + " opm:hasState ?state .\n";
        q += "\t\t?state ^opm:hasState ?origin .\n";
        q += "\t}\n";
        q += '\tGRAPH ?g2 {\n';
        q += "\t\t[ ^prov:wasDerivedFrom ?depState ] ?pos ?state .\n";
        q += "\t\t?depState ^opm:hasState ?propertyURI .\n";
        q += "\t\t#FINDING THE FoI IS ONLY POSSIBLE WITH REASONING\n";
        q += "\t\tOPTIONAL { ?propertyURI seas:isPropertyOf ?foiURI . }\n";
        q += '\t\t#EXCLUDE DELETED\n';
        q += '\t\tMINUS { ?depState a opm:Deleted }\n';
        q += "\t}\n";
        q += "}\n";
        return q;
    };
    OPMProp.prototype.getHost = function (someURI) {
        var q = '';
        q += '\t#EXTRACT HOST URI\n';
        q += "\tBIND(IF(CONTAINS(STR(" + someURI + "), \"https://\"), \"https://\", \"http://\") AS ?http)\n";
        q += "\tBIND(STRAFTER(STR(" + someURI + "), STR(?http)) AS ?substr1)\n";
        q += '\tBIND(STRAFTER(STR(?substr1), "/") AS ?substr2)\n';
        q += '\tBIND(STRBEFORE(STR(?substr1), "/") AS ?host)\n';
        q += '\tBIND(STRBEFORE(STR(?substr2), "/") AS ?db)\n';
        return q;
    };
    return OPMProp;
}());
exports.OPMProp = OPMProp;

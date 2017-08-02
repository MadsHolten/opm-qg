"use strict";
var _ = require("underscore");
var _s = require("underscore.string");
var OPMCalc = (function () {
    function OPMCalc(input) {
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
            if (!_.contains(prefixes, 'opm')) {
                this.input.prefixes.push({ prefix: 'opm', uri: 'https://w3id.org/opm#' });
            }
            //datatype defaults to xsd:string
            if (this.input.result) {
                this.input.result.datatype = this.input.result.datatype ? this.input.result.datatype : 'xsd:string';
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
    //Create calculation where it doesn't already exist
    OPMCalc.prototype.postCalc = function () {
        //Define variables
        var calc = this.input.result.calc; //The calculation to perform
        var userURI = this.input.userURI;
        var comment = this.input.comment;
        var args = this.input.args; //Arguments
        var property = this.input.result.property; //New property
        var foiURI = this.input.foiURI; //optional
        var unit = this.input.result.unit;
        var datatype = this.input.result.datatype;
        var foi = !foiURI ? '?foi' : '<' + foiURI + '>';
        var prefixes = this.input.prefixes;
        for (var i in args) {
            if (!args[i].targetPath) {
                //Add '?foi' as target path if none is given
                args[i].targetPath = '?foi';
            }
            else {
                //Clean target path if given
                var str = args[i].targetPath;
                str = _s.clean(str); //Remove unnecessary spaces etc.
                var target = _s.strRightBack(str, '?').replace(/ /g, '').replace('.', ''); //Get target variable name
                str = _s.endsWith(str, ".") ? str + ' ' : str + ' . '; //Make sure it ends with a dot and a space
                args[i].targetPath = str + "?" + target + " ";
            }
            if (foiURI) {
                //Replace '?foi' with the actual URI if one is defined
                var newFoI = "<" + foiURI + ">";
                args[i].targetPath = args[i].targetPath.replace('?foi', newFoI);
            }
        }
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
        }
        q += 'CONSTRUCT {\n';
        q += "\t" + foi + " " + property + " ?propertyURI .\n";
        q += '\t?propertyURI a opm:Property ;\n';
        q += '\t\trdfs:label "Derived Property"@en ;\n';
        q += '\t\topm:hasState ?stateURI .\n';
        if (userURI) {
            q += "\t?stateURI prov:wasAttributedTo " + userURI + " .\n";
        }
        if (comment) {
            q += "\t?stateURI rdfs:comment \"" + comment + "\"^^xsd:string .\n";
        }
        q += '\t?stateURI a opm:State , opm:Derived ;\n';
        q += '\t\trdfs:label "Derived State"@en ;\n';
        q += '\t\topm:valueAtState ?res ;\n';
        q += '\t\tprov:generatedAtTime ?now ;\n';
        q += '\t\topm:deleted ?del ;\n';
        q += '\t\topm:assumed ?ass ;\n';
        q += '\t\topm:confirmed ?conf ;\n';
        q += "\t\topm:expression \"" + calc + "\"^^xsd:string ;\n";
        q += '\t\tprov:wasDerivedFrom _:c0 .\n';
        q += '\t_:c0 a rdf:Seq .\n';
        // Add arguments to wasDerivedFrom sequence
        for (var i in args) {
            var _i = Number(i) + 1;
            q += "\t_:c0 rdf:_" + _i + " ?state" + _i + " .\n";
        }
        // Get data
        q += "} WHERE {\n";
        // Get latest evaluation of each argument
        for (var i in args) {
            var _i = Number(i) + 1;
            q += "\t#GET LATEST VALUE OF ARGUMENT " + _i + "\n";
            q += "\t{ SELECT ";
            q += !foiURI ? '?foi ' : '';
            q += "(MAX(?_t" + _i + ") AS ?t" + _i + ") WHERE {\n";
            q += '\t\tGRAPH ?g {\n';
            q += "\t\t\t" + args[i].targetPath + " " + args[i].property + "/opm:hasState\n";
            q += "\t\t\t\t[ prov:generatedAtTime  ?_t" + _i + " ] .\n";
            q += '\t\t}\n';
            q += !foiURI ? '\t} GROUP BY ?foi }\n' : '';
        }
        // No previous calculations must exist
        q += '\t#NO PREVIOUS CALCULATIONS MUST EXIST\n';
        q += '\tMINUS {\n';
        q += '\t\tGRAPH ?g {\n';
        q += "\t\t\t" + foi + " " + property + "/opm:hasState\n";
        q += '\t\t\t\t[ prov:generatedAtTime  ?_tc ] .\n';
        q += '\t\t}\n';
        q += '\t}\n';
        // Retrieve data
        q += "\tGRAPH ?g {\n";
        for (var i in args) {
            var _i = Number(i) + 1;
            q += "\t\t#GET ARGUMENT " + _i + " DATA\n";
            q += "\t\t" + args[i].targetPath + " " + args[i].property + "/opm:hasState ?state" + _i + " .\n";
            q += "\t\tOPTIONAL{ ?state" + _i + " opm:deleted ?del . }\n";
            q += "\t\tOPTIONAL{ ?state" + _i + " opm:assumed ?ass . }\n";
            q += "\t\tOPTIONAL{ ?state" + _i + " opm:confirmed ?conf . }\n";
            q += "\t\t?state" + _i + " prov:generatedAtTime ?t" + _i + " ;\n";
            q += "\t\t\topm:valueAtState ?v" + _i + " .\n";
            q += "\t\tBIND(xsd:decimal(strbefore(str(?v" + _i + "), \" \")) AS ?arg" + _i + ")\n"; //NB! might give problems with non-ucum
        }
        //NB! BIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/Property/", STRUUID())) AS ?propertyURI) should work - bug in Stardog
        q += "\t\t#PERFORM CALCULATION AND SPECIFY UNIT + DATATYPE\n";
        q += "\t\tBIND((" + calc + ") AS ?_res)\n";
        q += "\t\tBIND(strdt(concat(str(?_res), \" " + unit + "\"), " + datatype + ") AS ?res)\n";
        q += "\t\t#GENERATE URIs FOR NEW CLASS INSTANCES\n";
        q += "\t\tBIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n";
        q += this.getHost(foi);
        q += '\t\t#CREATE STATE AND PROPERTY URI´s\n';
        q += '\t\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q += '\t\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/Property/", ?guid)) AS ?propertyURI)\n';
        q += "\t\t#HOW TO HANDLE VALIDITY?\n";
        q += '\t\tBIND(IF(?del, true, false) AS ?del)\n';
        q += "\t\t#GET CURRENT TIME\n";
        q += "\t\tBIND(now() AS ?now)\n";
        q += '\t}\n';
        q += '}';
        return q;
    };
    //Update calculation where it already exist but inputs have changed
    OPMCalc.prototype.putCalc = function () {
        //Define variables
        var calc = this.input.result.calc; //The calculation to perform
        var userURI = this.input.userURI;
        var comment = this.input.comment;
        var args = this.input.args; //Arguments
        var property = this.input.result.property; //New property
        var foiURI = this.input.foiURI; //optional
        var unit = this.input.result.unit;
        var datatype = this.input.result.datatype;
        var foi = !foiURI ? '?foi' : '<' + foiURI + '>';
        var prefixes = this.input.prefixes;
        for (var i in args) {
            if (!args[i].targetPath) {
                //Add '?foi' as target path if none is given
                args[i].targetPath = '?foi';
            }
            else {
                //Clean target path if given
                var str = args[i].targetPath;
                str = _s.clean(str); //Remove unnecessary spaces etc.
                var target = _s.strRightBack(str, '?').replace(/ /g, '').replace('.', ''); //Get target variable name
                str = _s.endsWith(str, ".") ? str + ' ' : str + ' . '; //Make sure it ends with a dot and a space
                args[i].targetPath = str + "?" + target + " ";
            }
            if (foiURI) {
                //Replace '?foi' with the actual URI if one is defined
                var newFoI = "<" + foiURI + ">";
                args[i].targetPath = args[i].targetPath.replace('?foi', newFoI);
            }
        }
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
        }
        q += 'CONSTRUCT {\n';
        q += "\t" + foi + " " + property + " ?propertyURI .\n";
        q += '\t?propertyURI opm:hasState ?stateURI .\n';
        if (userURI) {
            q += "\t?stateURI prov:wasAttributedTo " + userURI + " .\n";
        }
        if (comment) {
            q += "\t?stateURI rdfs:comment \"" + comment + "\"^^xsd:string .\n";
        }
        q += '\t?stateURI a opm:State , opm:Derived ;\n';
        q += '\t\trdfs:label "Derived State"@en ;\n';
        q += '\t\topm:valueAtState ?res ;\n';
        q += '\t\tprov:generatedAtTime ?now ;\n';
        q += '\t\topm:deleted ?del ;\n';
        q += '\t\topm:assumed ?ass ;\n';
        q += '\t\topm:confirmed ?conf ;\n';
        q += "\t\topm:expression \"" + calc + "\"^^xsd:string ;\n";
        q += '\t\tprov:wasDerivedFrom _:c0 .\n';
        q += '\t_:c0 a rdf:Seq .\n';
        for (var i in args) {
            var _i = Number(i) + 1;
            q += "\t_:c0 rdf:_" + _i + " ?state" + _i + " .\n";
        }
        q += "} WHERE {\n";
        //Get latest calculation result
        q += "\t#GET LATEST CALCULATION RESULT\n";
        q += "\t{ SELECT ";
        q += !foiURI ? '?foi ' : '';
        q += "(MAX(?_tc) AS ?tc) WHERE {\n";
        q += "\t\tGRAPH ?gi {\n";
        q += "\t\t\t" + foi + " " + property + "/opm:hasState\n";
        q += "\t\t\t\t[ prov:generatedAtTime  ?_tc ] .\n";
        q += '\t\t}\n';
        q += !foiURI ? '\t} GROUP BY ?foi }\n' : '';
        // Get latest evaluation of each argument
        for (var i in args) {
            var _i = Number(i) + 1;
            q += "\t#GET LATEST VALUE OF ARGUMENT " + _i + "\n";
            q += "\t{ SELECT ";
            q += !foiURI ? '?foi ' : '';
            q += "(MAX(?_t" + _i + ") AS ?t" + _i + ") WHERE {\n";
            q += '\t\tGRAPH ?g {\n';
            q += "\t\t\t" + args[i].targetPath + " " + args[i].property + "/opm:hasState\n";
            q += "\t\t\t\t[ prov:generatedAtTime  ?_t" + _i + " ] .\n";
            q += '\t\t}\n';
            q += !foiURI ? '\t} GROUP BY ?foi }\n' : '';
        }
        //Only return if inputs have changed
        q += "\t#ONLY RETURN IF AN INPUT HAS CHANGED SINCE LAST CALCULATION\n";
        q += "\tFILTER(";
        for (var i in args) {
            var _i = Number(i) + 1;
            q += "( ?tc < ?t" + _i + " )";
            q += (_i != args.length) ? ' || ' : ')\n';
        }
        //Get propertyURI
        q += "\tGRAPH ?gi {\n";
        q += "\t\t" + foi + " " + property + " ?propertyURI .\n";
        q += '\t}\n';
        //Get argument values
        q += "\tGRAPH ?g {\n";
        for (var i in args) {
            var _i = Number(i) + 1;
            q += "\t\t#GET ARGUMENT " + _i + " DATA\n";
            q += "\t\t" + args[i].targetPath + " " + args[i].property + "/opm:hasState ?state" + _i + " .\n";
            q += "\t\tOPTIONAL{ ?state" + _i + " opm:deleted ?del . }\n";
            q += "\t\tOPTIONAL{ ?state" + _i + " opm:assumed ?ass . }\n";
            q += "\t\tOPTIONAL{ ?state" + _i + " opm:confirmed ?conf . }\n";
            q += "\t\t?state" + _i + " prov:generatedAtTime ?t" + _i + " ;\n";
            q += "\t\t\topm:valueAtState ?v" + _i + " .\n";
            q += "\t\tBIND(xsd:decimal(strbefore(str(?v" + _i + "), \" \")) AS ?arg" + _i + ")\n"; //NB! might give problems with non-ucum
        }
        //NB! BIND(URI(CONCAT("${hostURI}", "/Property/", STRUUID())) AS ?propertyURI) should work - bug in Stardog
        q += "\t\t#PERFORM CALCULATION AND SPECIFY UNIT + DATATYPE\n";
        q += "\t\tBIND((" + calc + ") AS ?_res)\n";
        q += "\t\tBIND(strdt(concat(str(?_res), \" " + unit + "\"), " + datatype + ") AS ?res)\n";
        q += "\t\t#GENERATE URIs FOR NEW CLASS INSTANCES\n";
        q += "\t\tBIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n";
        q += this.getHost(foi);
        q += '\t\t#CREATE STATE URI´s\n';
        q += '\t\tBIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/State/", ?guid)) AS ?stateURI)\n';
        q += "\t\t#GET CURRENT TIME\n";
        q += "\t\tBIND(now() AS ?now)\n";
        q += '\t}\n';
        q += '}';
        return q;
    };
    OPMCalc.prototype.postCalcData = function () {
        //Define variables
        var label = this.input.label;
        var comment = this.input.comment;
        var userURI = this.input.userURI;
        var hostURI = this.input.hostURI; //Needed as there is nothing else to extract it from
        var calc = this.input.result.calc; //The calculation to perform
        var args = this.input.args; //Arguments
        var property = this.input.result.property; //New property
        var foiURI = this.input.foiURI; //optional
        var unit = this.input.result.unit;
        var datatype = this.input.result.datatype;
        var foi = !foiURI ? '?foi' : '<' + foiURI + '>';
        var prefixes = this.input.prefixes;
        for (var i in args) {
            if (!args[i].targetPath) {
                //Add '?foi' as target path if none is given
                args[i].targetPath = '?foi';
            }
            else {
                //Clean target path if given
                var str = args[i].targetPath;
                str = _s.clean(str); //Remove unnecessary spaces etc.
                var target = _s.strRightBack(str, '?').replace(/ /g, '').replace('.', ''); //Get target variable name
                str = _s.endsWith(str, ".") ? str + ' ' : str + ' . '; //Make sure it ends with a dot and a space
                args[i].targetPath = str + "?" + target + " ";
            }
            if (foiURI) {
                //Replace '?foi' with the actual URI if one is defined
                var newFoI = "<" + foiURI + ">";
                args[i].targetPath = args[i].targetPath.replace('?foi', newFoI);
            }
        }
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
        }
        q += 'CONSTRUCT {\n';
        if (label) {
            q += "\t?calcURI rdfs:label \"" + label + "\"^^xsd:string .\n";
        }
        if (comment) {
            q += "\t?calcURI rdfs:comment \"" + comment + "\"^^xsd:string .\n";
        }
        if (userURI) {
            q += "\t?calcURI prov:wasAttributedTo " + userURI + " .\n";
        }
        q += '\t\t?calcURI prov:generatedAtTime ?now ;\n';
        q += "\t\topm:inferredProperty \"" + property + "\"^^xsd:string ;\n";
        q += "\t\topm:expression \"" + calc + "\"^^xsd:string ;\n";
        q += "\t\topm:unit \"" + unit + "\"^^" + datatype + " ;\n";
        q += '\t\topm:arguments _:c0 .\n';
        q += '\t_:c0 a rdf:Seq .\n';
        // Add arguments to arguments sequence
        for (var i in args) {
            var _i = Number(i) + 1;
            q += "\t_:c0 rdf:_" + _i + " ?arg" + _i + " .\n";
            q += "\t?arg" + _i + " opm:property " + args[i].property + " .\n";
            if (args[i].targetPath) {
                q += "\t?arg" + _i + " opm:targetPath " + args[i].targetPath + " .\n";
            }
        }
        q += '} WHERE {\n';
        q += "\t#GENERATE URIs FOR NEW CLASS INSTANCE\n";
        q += "\tBIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n";
        q += '\t#CREATE STATE AND PROPERTY URI´s\n';
        q += "\tBIND(URI(CONCAT(STR(\"" + hostURI + "\"), \"/Calculation/\", ?guid)) AS ?calcURI)\n";
        for (var i in args) {
            var _i = Number(i) + 1;
            q += "\tBIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid" + _i + ")\n";
            q += "\tBIND(URI(CONCAT(STR(\"" + hostURI + "\"), \"/Argument/\", ?guid" + _i + ")) AS ?arg" + _i + ")\n";
        }
        q += "\t#GET CURRENT TIME\n";
        q += "\tBIND(now() AS ?now)\n";
        q += '}';
        return q;
    };
    //List outdated calculations
    //Checks either generally or for a specific FoI
    //Returns the following:
    OPMCalc.prototype.listOutdated = function () {
        var foiURI = this.input ? this.input.foiURI : undefined;
        var evalPath = '';
        if (foiURI) {
            evalPath = "<" + foiURI + "> ?hasProp ?propertyURI . ";
        }
        var q = '';
        //Define prefixes
        q += 'PREFIX prov: <http://www.w3.org/ns/prov#>\n';
        q += 'PREFIX opm: <https://w3id.org/opm#>\n';
        if (this.queryType == 'construct') {
            q += 'CONSTRUCT {\n';
            q += '\t?propertyURI opm:hasState ?calcState .\n';
            q += '\t?calcState opm:newArguments _:newArgs ;\n';
            q += '\t\tprov:wasDerivedFrom _:oldArgs ;\n';
            q += '\t\tprov:generatedAtTime ?calc_time ;\n';
            q += '\t\topm:valueAtState ?old_res .\n';
            q += '\t_:newArgs ?position ?new_arg .\n';
            q += '\t_:oldArgs ?position ?old_arg .\n';
            q += '\t?old_arg opm:valueAtState ?old_val .\n';
            q += '\t?new_arg opm:valueAtState ?new_val .\n';
            q += '\t?new_arg opm:deleted ?del .\n';
            q += '\t?new_arg opm:confirmed ?conf .\n';
            q += '}\n';
        }
        else {
            q += 'SELECT ?propertyURI ?calc_time ?arg_last_update ?new_arg ?old_val ?new_val\n';
        }
        q += 'WHERE {\n';
        //Get the time of the latest calculation
        //Property has opm:hasState that is derived from something else
        q += "\t#GET TIME OF LATEST CALCULATION\n";
        q += "\t{ SELECT  ?propertyURI (MAX(?tc) AS ?calc_time) WHERE {\n";
        q += "\t\tGRAPH ?gi {\n";
        q += "\t\t\t" + evalPath + "\n";
        q += "\t\t\t?propertyURI opm:hasState _:b0 .\n";
        q += "\t\t\t_:b0 prov:wasDerivedFrom+ [?p ?o] .\n";
        q += "\t\t\t_:b0 prov:generatedAtTime ?tc .\n";
        q += "\t\t}\n";
        q += "\t} GROUP BY ?propertyURI }\n";
        //Get data about calculation
        q += "\t#GET DATA ABOUT CALCULATION\n";
        q += "\tGRAPH ?gi {\n";
        q += "\t\t" + evalPath + "\n";
        q += "\t\t?propertyURI opm:hasState ?calcState .\n";
        q += "\t\t?calcState prov:wasDerivedFrom+ [?position ?old_arg] .\n";
        q += "\t\t?calcState prov:generatedAtTime ?calc_time .\n";
        q += "\t\t?calcState opm:valueAtState ?old_res .\n";
        q += "\t}\n";
        //Get the time of the latest input values
        q += "\t#GET TIME OF LATEST ARGUMENTS\n";
        q += "\t{ SELECT  ?old_arg (MAX(?ta) AS ?arg_last_update) WHERE {\n";
        q += "\t\tGRAPH ?g {\n";
        q += "\t\t\t?old_arg ^opm:hasState/opm:hasState ?arg .\n";
        q += "\t\t\t?arg prov:generatedAtTime ?ta .\n";
        q += "\t\t}\n";
        q += "\t} GROUP BY ?old_arg }\n";
        //Get argument values
        q += "\t#GET DATA ABOUT ARGUMENTS\n";
        q += "\tGRAPH ?g {\n";
        q += "\t\t?old_arg ^opm:hasState/opm:hasState ?new_arg ;\n";
        q += "\t\t\topm:valueAtState ?old_val .\n";
        q += "\t\t?new_arg prov:generatedAtTime  ?arg_last_update ;\n";
        q += "\t\t\topm:valueAtState ?new_val .\n";
        q += '\t\tOPTIONAL{ ?new_arg opm:deleted ?del . }\n';
        q += '\t\tOPTIONAL{ ?new_arg opm:confirmed ?conf . }\n';
        q += "\t}\n";
        //Filter to only show outdated calculations
        q += "\t#ONLY SHOW OUTDATED\n";
        q += "\tFILTER(?arg_last_update > ?calc_time)\n";
        q += "}";
        return q;
    };
    OPMCalc.prototype.checkCircularDependency = function () {
        var q = '';
        q += 'ASK\n';
        q += 'WHERE {\n';
        q += '}\n';
        return q;
    };
    OPMCalc.prototype.getHost = function (someURI) {
        var q = '';
        q += '\t\t#EXTRACT HOST URI\n';
        q += "\t\tBIND(IF(CONTAINS(STR(" + someURI + "), \"https://\"), \"https://\", \"http://\") AS ?http)\n";
        q += "\t\tBIND(STRAFTER(STR(" + someURI + "), STR(?http)) AS ?substr1)\n";
        q += '\t\tBIND(STRAFTER(STR(?substr1), "/") AS ?substr2)\n';
        q += '\t\tBIND(STRBEFORE(STR(?substr1), "/") AS ?host)\n';
        q += '\t\tBIND(STRBEFORE(STR(?substr2), "/") AS ?db)\n';
        return q;
    };
    return OPMCalc;
}());
exports.OPMCalc = OPMCalc;

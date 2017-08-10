"use strict";
var _ = require("underscore");
var _s = require("underscore.string");
var OPMCalc = (function () {
    function OPMCalc() {
        //Predefined prefixes
        this.prefixes = [
            { prefix: 'rdf', uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' },
            { prefix: 'xsd', uri: 'http://www.w3.org/2001/XMLSchema#' },
            { prefix: 'prov', uri: 'http://www.w3.org/ns/prov#' },
            { prefix: 'opm', uri: 'https://w3id.org/opm#' },
            { prefix: 'seas', uri: 'https://w3id.org/seas/' },
            { prefix: 'sd', uri: 'http://www.w3.org/ns/sparql-service-description#' }
        ];
    }
    OPMCalc.prototype.listCalculations = function (input) {
        var queryType = input.queryType;
        var prefixes = this.prefixes;
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        if (queryType == 'construct') {
            q += 'CONSTRUCT {\n';
            q += '\t?calculationURI a ?calcClasses ;\n';
            q += '\t\tsd:namedGraph ?g ;\n';
            q += '\t\trdfs:label ?label ;\n';
            q += '\t\trdfs:comment ?comment .\n';
            q += '}\n';
        }
        else {
            q += 'SELECT ?calculationURI ?label ?comment\n';
        }
        q += 'WHERE {\n';
        q += '\tGRAPH ?g {\n';
        q += '\t\t?calculationURI opm:inferredProperty ?inferredProperty ;\n';
        q += '\t\t\tprov:generatedAtTime ?timestamp ;\n';
        q += '\t\tOPTIONAL{ ?arg opm:targetPath ?argTP . }\n';
        q += '\t\tOPTIONAL{ ?calculationURI a ?calcClasses . }\n';
        q += '\t\tOPTIONAL{ ?calculationURI rdfs:label ?label . }\n';
        q += '\t\tOPTIONAL{ ?calculationURI rdfs:comment ?comment . }\n';
        q += '\t}\n';
        q += '}';
        return q;
    };
    //List outdated calculations
    //Checks either generally or for a specific FoI
    //Returns the following:
    OPMCalc.prototype.listOutdated = function (input) {
        var foiURI = input.foiURI;
        var queryType = input.queryType;
        var q = '';
        //Define prefixes
        q += 'PREFIX prov: <http://www.w3.org/ns/prov#>\n';
        q += 'PREFIX opm: <https://w3id.org/opm#>\n';
        if (queryType == 'construct') {
            q += 'CONSTRUCT {\n';
            q += '\t?foi ?hasProp ?propertyURI .\n';
            q += '\t?propertyURI opm:hasState ?calcState .\n';
            q += '\t?calcState opm:newArguments _:newArgs ;\n';
            q += '\t\tprov:wasDerivedFrom _:oldArgs ;\n';
            q += '\t\tprov:generatedAtTime ?calc_time ;\n';
            q += '\t\topm:valueAtState ?old_res .\n';
            q += '\t_:newArgs ?position ?new_arg .\n';
            q += '\t_:oldArgs ?position ?old_arg .\n';
            q += '\t?old_arg opm:valueAtState ?old_val .\n';
            q += '\t?new_arg opm:valueAtState ?new_val .\n';
            q += '}\n';
        }
        else {
            q += 'SELECT ?propertyURI ?calc_time ?arg_last_update ?new_arg ?old_val ?new_val\n';
        }
        q += 'WHERE {\n';
        if (foiURI) {
            q += "\tBIND(<" + foiURI + "> AS ?foi)\n";
        }
        //Get the time of the latest calculation
        //Property has opm:hasState that is derived from something else
        q += "\t#GET TIME OF LATEST CALCULATION\n";
        q += "\t{ SELECT  ?propertyURI (MAX(?tc) AS ?calc_time) WHERE {\n";
        q += "\t\tGRAPH ?gi {\n";
        q += "\t\t\t?foi ?hasProp ?propertyURI .\n";
        q += "\t\t\t?propertyURI opm:hasState _:b0 .\n";
        q += "\t\t\t_:b0 prov:wasDerivedFrom+ [?p ?o] .\n";
        q += "\t\t\t_:b0 prov:generatedAtTime ?tc .\n";
        q += "\t\t}\n";
        q += "\t} GROUP BY ?propertyURI }\n";
        //Get data about calculation
        q += "\t#GET DATA ABOUT CALCULATION\n";
        q += "\tGRAPH ?gi {\n";
        q += "\t\t?foi ?hasProp ?propertyURI .\n";
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
        q += "\t}\n";
        //Filter to only show outdated calculations
        q += "\t#ONLY SHOW OUTDATED\n";
        q += "\tFILTER(?arg_last_update > ?calc_time)\n";
        q += "}";
        return q;
    };
    OPMCalc.prototype.getCalcData = function (input) {
        var calculationURI = input.calculationURI;
        var queryType = input.queryType;
        var prefixes = this.prefixes;
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        if (queryType == 'construct') {
            q += 'CONSTRUCT {\n';
            q += '\t?calculationURI a ?calcClasses ;\n';
            q += '\t\tsd:namedGraph ?g ;\n';
            q += '\t\topm:inferredProperty ?inferredProperty ;\n';
            q += '\t\tprov:generatedAtTime ?timestamp ;\n';
            q += '\t\topm:expression ?expression ;\n';
            q += '\t\topm:unit ?unit ;\n';
            q += '\t\trdfs:label ?label ;\n';
            q += '\t\trdfs:comment ?comment ;\n';
            q += '\t\topm:argumentPaths ?list .\n';
            q += '\t?listRest rdf:first ?head ;\n';
            q += '\t\trdf:rest ?tail .\n';
            q += '}\n';
        }
        else {
            q += 'SELECT ?calculationURI ?label ?comment ?inferredProperty ?timestamp\n';
        }
        q += 'WHERE {\n';
        q += '\tGRAPH ?g {\n';
        if (calculationURI) {
            q += "\t\tBIND(<" + calculationURI + "> AS ?calculationURI)\n";
        }
        q += '\t\t?calculationURI opm:inferredProperty ?inferredProperty ;\n';
        q += '\t\t\tprov:generatedAtTime ?timestamp ;\n';
        q += '\t\t\topm:expression ?expression ;\n';
        q += '\t\t\topm:argumentPaths ?list .\n';
        q += '\t\t?list rdf:rest* ?listRest .\n';
        q += '\t\t?listRest rdf:first ?head ;\n';
        q += '\t\t\trdf:rest ?tail .\n';
        q += '\t\tOPTIONAL{ ?arg opm:targetPath ?argTP . }\n';
        q += '\t\tOPTIONAL{ ?calculationURI a ?calcClasses . }\n';
        q += '\t\tOPTIONAL{ ?calculationURI rdfs:label ?label . }\n';
        q += '\t\tOPTIONAL{ ?calculationURI rdfs:comment ?comment . }\n';
        q += '\t\tOPTIONAL{ ?calculationURI opm:unit ?unit . }\n';
        q += '\t}\n';
        q += '}';
        return q;
    };
    OPMCalc.prototype.postCalcData = function (input) {
        //Define variables
        var label = input.label;
        var comment = input.comment;
        var userURI = input.userURI;
        var prefixes = this.prefixes;
        var hostURI = input.hostURI;
        var expression = input.expression;
        var argumentPaths = input.argumentPaths;
        //Inferred property
        var iProp = input.inferredProperty;
        var iPropURI = iProp.propertyURI;
        var iUnit = iProp.unit.value;
        var iDatatype = iProp.unit.datatype;
        //Add prefix(es) to the predefined ones
        if (input.prefixes) {
            prefixes = prefixes.concat(input.prefixes);
            //Remove duplicates
            prefixes = _.map(_.groupBy(prefixes, function (obj) {
                return obj.prefix;
            }), function (grouped) {
                return grouped[0];
            });
        }
        //Clean property (add triangle brackets if not prefixes)
        iPropURI = _s.startsWith(iPropURI, 'http') ? "<" + iPropURI + ">" : "" + iPropURI;
        //Make sure that argument paths begin with ?foi
        argumentPaths = _.map(argumentPaths, function (path) {
            var firstSubjectVar = _s.strLeft(_s.strRight(path, '?'), ' ');
            return path.replace('?' + firstSubjectVar, '?foi'); //Replace with ?foi
        });
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
        }
        q += 'CONSTRUCT {\n';
        q += "\t?calculationURI a opm:Calculation ;\n";
        if (label) {
            q += "\t\trdfs:label \"" + label + "\" ;\n";
        }
        if (comment) {
            q += "\t\trdfs:comment \"" + comment + "\" ;\n";
        }
        if (userURI) {
            q += "\t\tprov:wasAttributedTo <" + userURI + "> ;\n";
        }
        q += '\t\tprov:generatedAtTime ?now ;\n';
        q += "\t\topm:inferredProperty " + iPropURI + " ;\n";
        q += "\t\topm:expression \"" + expression + "\" ;\n";
        q += "\t\topm:unit \"" + iUnit + "\"";
        q += iDatatype ? "^^" + iDatatype + " ;\n" : ' ;\n';
        /**
         * THE FOLLOWING DOESN'T WORK WITH STARDOG
         */
        // q+= '\t\topm:arguments ( ';
        // // Add arguments to arguments list
        // for(var i in argumentPaths){
        //     q+= `argumentPaths[i]`;
        //     q+= (Number(i) == args.length-1) ? ' ) .\n' : ' ';
        // }
        /**
         * INSTEAD WE WILL HAVE TO NEST THE ARGUMENT LIST
         */
        q += '\t\topm:argumentPaths [\n';
        _.each(argumentPaths, function (obj, i) {
            q += '\t\t';
            q += _s.repeat("  ", i + 1); //two spaces
            q += "rdf:first \"" + argumentPaths[i] + "\" ; rdf:rest ";
            q += (argumentPaths.length == i + 1) ? 'rdf:nil\n' : '[\n';
        });
        _.each(argumentPaths, function (obj, i) {
            if (i < argumentPaths.length - 1) {
                q += '\t\t';
                q += _s.repeat("  ", argumentPaths.length - (i + 1));
                q += ']\n';
            }
        });
        q += '\t\t] .\n';
        q += '} WHERE {\n';
        q += "\t#GENERATE URIs FOR NEW CLASS INSTANCE\n";
        q += "\tBIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n";
        q += '\t#CREATE STATE AND PROPERTY URI´s\n';
        q += "\tBIND(URI(CONCAT(STR(\"" + hostURI + "\"), \"/Calculation/\", ?guid)) AS ?calculationURI)\n";
        q += "\t#GET CURRENT TIME\n";
        q += "\tBIND(now() AS ?now)\n";
        q += '}';
        return q;
    };
    //Create calculation where it doesn't already exist
    OPMCalc.prototype.postCalc = function (input) {
        //Define variables
        var prefixes = this.prefixes;
        var calculationURI = input.calculationURI;
        var expression = input.expression;
        var argumentPaths = input.argumentPaths;
        var argumentVars = [];
        var iProp = input.inferredProperty;
        var iUnit = input.unit.value;
        var iDatatype = input.unit.datatype;
        //Optional
        var foiURI = input.foiURI; //If only for a specific FoI
        //Add prefix(es) to the predefined ones
        if (input.prefixes) {
            prefixes = prefixes.concat(input.prefixes);
            //Remove duplicates
            prefixes = _.map(_.groupBy(prefixes, function (obj) {
                return obj.prefix;
            }), function (grouped) {
                return grouped[0];
            });
        }
        //Argument paths should not include space and dot in end
        argumentPaths = _.map(argumentPaths, function (path) {
            //Find last variable
            var lastArg = '?' + _s.strRightBack(path, '?');
            //remove things after space if any
            if (_s.contains(lastArg, ' ')) {
                argumentVars.push(_s.strLeftBack(lastArg, ' '));
                return _s.strLeftBack(path, ' ');
            }
            argumentVars.push(lastArg);
            return path;
        });
        //Clean property (add triangle brackets if not prefixes)
        iProp = _s.startsWith(iProp, 'http') ? "<" + iProp + ">" : "" + iProp;
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
        }
        q += 'CONSTRUCT {\n';
        q += "\t?foi " + iProp + " ?propertyURI .\n";
        q += '\t?propertyURI a opm:Property ;\n';
        q += '\t\trdfs:label "Derived Property"@en ;\n';
        q += '\t\topm:hasState ?stateURI .\n';
        q += '\t?stateURI a opm:State , opm:Derived ;\n';
        q += '\t\trdfs:label "Derived State"@en ;\n';
        q += '\t\topm:valueAtState ?res ;\n';
        q += '\t\tprov:generatedAtTime ?now ;\n';
        q += "\t\topm:expression \"" + expression + "\" ;\n";
        q += "\t\tprov:wasAttributedTo <" + calculationURI + "> ;\n";
        /**
         * ARGUMENT PATHS
         */
        q += '\t\topm:argumentPaths [\n';
        _.each(argumentPaths, function (obj, i) {
            q += '\t\t';
            q += _s.repeat("  ", i + 1); //two spaces
            q += "rdf:first \"" + argumentPaths[i] + "\" ; rdf:rest ";
            q += (argumentPaths.length == i + 1) ? 'rdf:nil\n' : '[\n';
        });
        _.each(argumentPaths, function (obj, i) {
            if (i < argumentPaths.length - 1) {
                q += '\t\t';
                q += _s.repeat("  ", argumentPaths.length - (i + 1));
                q += ']\n';
            }
        });
        q += '\t\t] ;\n';
        // /**
        //  * DERIVED FROM
        //  */
        q += '\t\tprov:wasDerivedFrom [\n';
        _.each(argumentPaths, function (obj, i) {
            var _i = Number(i) + 1;
            q += '\t\t';
            q += _s.repeat("  ", i + 1); //two spaces
            q += "rdf:first ?state" + _i + " ; rdf:rest ";
            q += (argumentPaths.length == i + 1) ? 'rdf:nil\n' : '[\n';
        });
        _.each(argumentPaths, function (obj, i) {
            if (i < argumentPaths.length - 1) {
                q += '\t\t';
                q += _s.repeat("  ", argumentPaths.length - (i + 1));
                q += ']\n';
            }
        });
        q += '\t\t] .\n';
        // Get data
        q += "} WHERE {\n";
        if (foiURI) {
            q += "BIND(" + foiURI + " AS ?foi)";
        }
        // Get latest evaluation of each argument
        for (var i in argumentPaths) {
            var _i = Number(i) + 1;
            q += "\t#GET LATEST VALUE OF ARGUMENT " + _i + " (var " + argumentVars[i] + ")\n";
            q += "\t{ SELECT ?foi (MAX(?_t" + _i + ") AS ?t" + _i + ") WHERE {\n";
            q += '\t\tGRAPH ?g {\n';
            q += "\t\t\t" + argumentPaths[i] + " .\n";
            q += "\t\t\t" + argumentVars[i] + " opm:hasState ?state .\n";
            q += "\t\t\t?state prov:generatedAtTime ?_t" + _i + " .\n";
            q += '\t\t}\n';
            q += !foiURI ? '\t} GROUP BY ?foi }\n' : '';
        }
        // No previous calculations must exist
        q += '\t#NO PREVIOUS CALCULATIONS MUST EXIST\n';
        q += '\tMINUS {\n';
        q += '\t\tGRAPH ?g {\n';
        q += "\t\t\t?foi " + iProp + "/opm:hasState\n";
        q += '\t\t\t\t[ prov:generatedAtTime  ?_tc ] .\n';
        q += '\t\t}\n';
        q += '\t}\n';
        // Retrieve data
        q += '\t#GET DATA\n';
        q += "\tGRAPH ?g {\n";
        for (var i in argumentPaths) {
            var _i = Number(i) + 1;
            q += "\t\t#GET ARGUMENT " + _i + " DATA\n";
            q += "\t\t" + argumentPaths[i] + " .\n";
            q += "\t\t\t" + argumentVars[i] + " opm:hasState ?state" + _i + " .\n";
            q += "\t\t?state" + _i + " prov:generatedAtTime ?t" + _i + " ;\n";
            q += "\t\t\topm:valueAtState ?v" + _i + " .\n";
            q += "\t\tBIND(xsd:decimal(strbefore(str(?v" + _i + "), \" \")) AS ?arg" + _i + ")\n"; //NB! might give problems with non-ucum
        }
        //NB! BIND(URI(CONCAT(STR(?http), STR(?host), "/", STR(?db), "/Property/", STRUUID())) AS ?propertyURI) should work - bug in Stardog
        q += "\t\t#PERFORM CALCULATION AND SPECIFY UNIT + DATATYPE\n";
        q += "\t\tBIND((" + expression + ") AS ?_res)\n";
        q += "\t\tBIND(strdt(concat(str(?_res), \" " + iUnit + "\"), " + iDatatype + ") AS ?res)\n";
        q += "\t\t#GENERATE URIs FOR NEW CLASS INSTANCES\n";
        q += "\t\tBIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n";
        q += this.getHost("<" + calculationURI + ">");
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

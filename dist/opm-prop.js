var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("underscore");
var _s = require("underscore.string");
var base_1 = require("./base");
var OPMProp = (function (_super) {
    __extends(OPMProp, _super);
    function OPMProp() {
        _super.apply(this, arguments);
    }
    /**
     * POST BY FoI INSERT QUERY
     * @param foiURI        URI of the Feature of Interest (FoI) to which the property should be added
     * @param property      URI of the property to be assigned to the FoI
     * @param value         value of the property
     * @param reliability   reliability (optional)
     * @param userURI       URI of the user who assigned the property (optional)
     * @param comment       comment - why was it assigned? (optional)
     */
    OPMProp.prototype.postByFoI = function (foiURI, property, value, reliability, userURI, comment) {
        var input = {
            host: this.host,
            foiURI: foiURI,
            inferredProperty: property,
            value: value,
            reliability: reliability,
            userURI: userURI,
            comment: comment,
            queryType: 'insert'
        };
        return this.postProp(input);
    };
    /**
     * POST BY PATH INSERT QUERY
     * @param path          Path to be matched to find Feature of Interest (FoI)
     * @param property      URI of the property to be assigned to the FoI
     * @param value         value of the property
     * @param reliability   reliability (optional)
     * @param userURI       URI of the user who assigned the property (optional)
     * @param comment       comment - why was it assigned? (optional)
     */
    OPMProp.prototype.postByPath = function (path, property, value, reliability, userURI, comment) {
        var input = {
            host: this.host,
            path: path,
            inferredProperty: property,
            value: value,
            reliability: reliability,
            userURI: userURI,
            comment: comment,
            queryType: 'insert'
        };
        return this.postProp(input);
    };
    /**
     * PUT BY FoI INSERT QUERY
     * Update a property of a specific FoI
     * @param foiURI        URI of the Feature of Interest (FoI) holding the property that is to be updated
     * @param property      URI of the property
     * @param value         value of the property
     * @param reliability   reliability (optional)
     * @param userURI       URI of the user who assigned the property (optional)
     * @param comment       comment - why was it assigned? (optional)
     */
    OPMProp.prototype.putByFoI = function (foiURI, property, value, reliability, userURI, comment) {
        var input = {
            host: this.host,
            foiURI: foiURI,
            inferredProperty: property,
            value: value,
            reliability: reliability,
            userURI: userURI,
            comment: comment,
            queryType: 'insert'
        };
        return this.putProp(input);
    };
    /**
     * PUT PROPERTY INSERT QUERY
     * Update specific property
     * @param propertyURI   URI of the property
     * @param value         value of the property
     * @param reliability   reliability (optional)
     * @param userURI       URI of the user who assigned the property (optional)
     * @param comment       comment - why was it assigned? (optional)
     */
    OPMProp.prototype.putProperty = function (propertyURI, value, reliability, userURI, comment) {
        var input = {
            host: this.host,
            propertyURI: propertyURI,
            value: value,
            reliability: reliability,
            userURI: userURI,
            comment: comment,
            queryType: 'insert'
        };
        return this.putProp(input);
    };
    /**
     * DELETE PROPERTY INSERT QUERY
     * A new state of type opm:Deleted will be inferred meaning that it can be restored at any time
     * @param propertyURI   URI of the property
     * @param userURI       URI of the user who assigned the property (optional)
     * @param comment       comment - why was it assigned? (optional)
     */
    OPMProp.prototype.deleteProperty = function (propertyURI, userURI, comment) {
        var input = {
            host: this.host,
            propertyURI: propertyURI,
            userURI: userURI,
            comment: comment,
            reliability: 'deleted',
            queryType: 'insert'
        };
        return this.setReliability(input);
    };
    /**
     * RESTORE PROPERTY INSERT QUERY
     * @param propertyURI   URI of the property
     */
    OPMProp.prototype.restoreProperty = function (propertyURI) {
        var input = {
            host: this.host,
            propertyURI: propertyURI,
            queryType: 'insert'
        };
        return this.restoreProp(input);
    };
    /**
     * CONFIRM PROPERTY INSERT QUERY
     * @param propertyURI   URI of the property
     * @param userURI       URI of the user who assigned the property (optional)
     * @param comment       comment - why was it assigned? (optional)
     */
    OPMProp.prototype.confirmProperty = function (propertyURI, userURI, comment) {
        var input = {
            host: this.host,
            propertyURI: propertyURI,
            userURI: userURI,
            comment: comment,
            reliability: 'confirmed',
            queryType: 'insert'
        };
        return this.setReliability(input);
    };
    /**
     * GET PROPERTIES BY URI OF FoI
     * Returns only the latest states and does not return results for deleted properties
     * @param foiURI        URI of the Feature of Interest (FoI) to which the property is assigned
     * @param queryType     Return results as 'construct' or 'select'? (defaults to 'construct')
      */
    OPMProp.prototype.getFoIProps = function (foiURI, queryType) {
        if (!queryType)
            queryType = 'construct';
        var input = {
            foiURI: foiURI,
            queryType: queryType,
            latest: true
        };
        return this.getProps(input);
    };
    /**
     * GET PROPERTIES BY PROPERTY TYPE
     * Returns only the latest states and does not return results for deleted properties
     * @param property      URI of the property that is assigned to the FoI
     * @param queryType     Return results as 'construct' or 'select'? (defaults to 'construct')
     */
    OPMProp.prototype.getPropsByType = function (property, queryType) {
        if (!queryType)
            queryType = 'construct';
        var input = {
            property: property,
            queryType: queryType,
            latest: true
        };
        return this.getProps(input);
    };
    /**
     * GET PROPERTY HISTORY FOR SPECIFIC PROPERTY
     * Returns all states
     * @param propertyURI   URI of the particular property
     * @param queryType     Return results as 'construct' or 'select'? (defaults to 'construct')
     */
    OPMProp.prototype.getPropertyHistory = function (propertyURI, queryType) {
        if (!queryType)
            queryType = 'construct';
        var input = {
            propertyURI: propertyURI,
            queryType: queryType,
            latest: false
        };
        return this.getProps(input);
    };
    /**
     * GENERIC METHODS
     */
    // Create property for a FoI where it doesn't already exist
    OPMProp.prototype.postProp = function (input) {
        // Get global variables
        var host = this.host;
        var prefixes = this.prefixes;
        // Retrieve and process variables
        var property = input.inferredProperty;
        var value = input.value;
        // Optional
        var foiURI = this.cleanURI(input.foiURI);
        var path = input.path ? this.cleanPath(input.path) : '?foi ?p ?o .\n';
        var reliability = input.reliability;
        var userURI = this.cleanPath(input.userURI);
        var comment = input.comment;
        var reliabilityClass = reliability ? this.mapReliability(reliability) : null; // Map reliability class if given
        var queryType = input.queryType ? input.queryType : this.queryType; // Get default if not defined
        // Throw error if no foiURI or path received
        if (!foiURI && !path) {
            this.err = new Error("Specify either a foiURI or a path");
        }
        //Clean property (add triangle brackets if not prefixed)
        property = _s.startsWith(property, 'http') ? "<" + property + ">" : "" + property;
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';
        var d = queryType != 'insert' ? '' : '\t';
        if (queryType == 'construct')
            q += '\nCONSTRUCT {\n';
        if (queryType == 'insert') {
            q += '\nINSERT {\n';
            if (!this.mainGraph)
                q += "\tGRAPH <" + host + "> {\n";
        }
        q += (d + "\t?foi " + property + " ?propertyURI .\n") +
            (d + "\t?propertyURI a opm:Property ;\n") +
            (d + "\t\topm:hasState ?stateURI .\n");
        if (reliabilityClass)
            q += d + "\t?stateURI a " + reliabilityClass + " .\n";
        q += d + "\t?stateURI a opm:CurrentState ;\n";
        if (userURI)
            q += d + "\t\tprov:wasAttributedTo ?userURI ;\n";
        if (comment)
            q += d + "\t\trdfs:comment ?comment ;\n";
        q += (d + "\t\topm:valueAtState ?val ;\n") +
            (d + "\t\tprov:generatedAtTime ?now .\n");
        if (!this.mainGraph)
            q += c;
        q += '}\n';
        q += 'WHERE {\n';
        q += a;
        // If posting to a specific FoI
        if (foiURI)
            q += b + "\tBIND(" + foiURI + " AS ?foi)\n";
        if (userURI)
            q += d + "\tBIND(" + userURI + " AS ?userURI)\n";
        if (comment)
            q += d + "\tBIND(\"" + comment + "\" AS ?comment)\n";
        q += b + "\tBIND(" + value + " AS ?val)\n\n";
        // q+= `${b}\t{ SELECT DISTINCT ?foi WHERE {\n`;
        // q+= `${b}\t\t${path}\n`;
        // q+= `${b}\t}}\n\n`;
        q += foiURI ? b + "\t# FoI MUST EXIST\n" : b + "\t# PATH TO BE MATCHED\n";
        q += b + "\t" + path + "\n";
        q += (b + "\t# THE FoI CANNOT HAVE THE PROPERTY ASSIGNED ALREADY\n") +
            (b + "\tMINUS { ?foi " + property + " ?prop . }\n\n") +
            (b + "\t# CREATE STATE AND PROPERTY URIs\n") +
            (b + "\tBIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n\n") +
            (b + "\tBIND(URI(CONCAT(\"" + host + "\", \"State/\", ?guid)) AS ?stateURI)\n") +
            (b + "\tBIND(URI(CONCAT(\"" + host + "\", \"Property/\", ?guid)) AS ?propertyURI)\n") +
            (b + "\tBIND(now() AS ?now)\n");
        q += c;
        q += "}";
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    // Update FoI property
    OPMProp.prototype.putProp = function (input) {
        // Get global variables
        var host = this.host;
        var prefixes = this.prefixes;
        // Retrieve and process variables
        var value = input.value;
        // Optional
        var propertyURI = this.cleanURI(input.propertyURI); // OPTION 1
        var foiURI = this.cleanURI(input.foiURI); // OPTION 2
        var property = input.inferredProperty; // OPTION 2
        var path = input.path; // OPTION 3
        var reliability = input.reliability;
        var reliabilityClass = reliability ? this.mapReliability(reliability) : null; // Map reliability class if given
        var userURI = this.cleanPath(input.userURI);
        var comment = input.comment;
        var queryType = input.queryType ? input.queryType : this.queryType; // Get default if not defined
        // Either foiURI/property pair, propertyURI or path must be specified
        if (!path && !propertyURI) {
            if (foiURI && !property)
                this.err = new Error("Specify a property to be assigned to the FoI");
            if (!foiURI && property)
                this.err = new Error("Specify a FoI to assign the property to");
        }
        else if (!path) {
            if (!propertyURI)
                this.err = new Error("Specify a property URI");
        }
        else {
            this.err = new Error("Specify either a path, a foiURI/property pair or a propertyURI");
        }
        // Clean path
        path = path ? this.cleanPath(path) : '?foi ?p ?o .';
        // Clean property (add triangle brackets if not prefixed)
        property = _s.startsWith(property, 'http') ? "<" + property + ">" : "" + property;
        var q = '';
        // Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
        }
        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';
        var d = queryType != 'insert' ? '' : '\t';
        if (queryType == 'construct')
            q += '\nCONSTRUCT {\n';
        if (queryType == 'insert') {
            // FIRST DELETE CURRENT STATE CLASS FROM PREVIOUS STATE
            q += '\nDELETE {\n';
            if (!this.mainGraph)
                q += "\tGRAPH <" + host + "> {\n";
            q += b + "\t?previousState a opm:CurrentState .\n";
            if (!this.mainGraph)
                q += c;
            q += '}\n';
            q += 'INSERT {\n';
            if (!this.mainGraph)
                q += "\tGRAPH <" + host + "> {\n";
            q += b + "\t?previousState a opm:State .";
        }
        q += "" + b + d + "\t?propertyURI opm:hasState ?stateURI .\n";
        q += "" + b + d + "\t?stateURI a opm:CurrentState";
        q += reliabilityClass ? " , " + reliabilityClass + " ;\n" : " ;\n";
        if (userURI)
            q += d + "\t\tprov:wasAttributedTo ?userURI ;\n";
        if (comment)
            q += d + "\t\trdfs:comment ?comment ;\n";
        q += "" + b + d + "\t\topm:valueAtState ?val ;\n";
        q += "" + b + d + "\t\tprov:generatedAtTime ?now .\n";
        if (!this.mainGraph)
            q += c;
        q += '}\n';
        q += 'WHERE {\n';
        q += a; // Named graph
        // If posting to a specific FoI        
        if (foiURI)
            q += b + "\tBIND(" + foiURI + " AS ?foi)\n";
        // If posting to a specific Property
        if (propertyURI)
            q += b + "\tBIND(" + propertyURI + " AS ?propertyURI)\n";
        if (userURI)
            q += d + "\tBIND(" + userURI + " AS ?userURI)\n";
        if (comment)
            q += d + "\tBIND(\"" + comment + "\" AS ?comment)\n";
        q += b + "\tBIND(" + value + " AS ?val)\n\n";
        q += b + "\t# GET DATA FROM LATEST STATE\n";
        if (!propertyURI)
            q += b + "\t?foi " + property + " ?propertyURI .\n";
        q += b + "\t?propertyURI opm:hasState ?previousState .\n";
        q += b + "\t?previousState a opm:CurrentState ;\n";
        q += b + "\t\t\topm:valueAtState ?previousVal .\n\n";
        //if(path) q+= `\t\t\t${path}\n\n`;
        q += b + "\t# FILTER OUT DELETED OR CONFIRMED\n";
        q += b + "\tMINUS{ ?previousState a opm:Deleted }\n";
        q += b + "\tMINUS{ ?previousState a opm:Confirmed }\n\n";
        q += b + "\t#VALUE SHOULD BE DIFFERENT FROM THE PREVIOUS\n";
        q += b + "\tFILTER(?previousVal != ?val)\n";
        q += b + "\t#CREATE STATE URIs\n";
        q += b + "\tBIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n";
        q += b + "\tBIND(URI(CONCAT(\"" + host + "\", \"State/\", ?guid)) AS ?stateURI)\n";
        q += b + "\tBIND(now() AS ?now)\n";
        q += c; // Named graph
        q += "}";
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Set reliability
    //Make it an assumption or a confirmed property
    //Also possible to delete it
    OPMProp.prototype.setReliability = function (input) {
        // Get global variables
        var host = this.host;
        var prefixes = this.prefixes;
        // Retrieve and process variables
        var comment = input.comment;
        var propertyURI = input.propertyURI;
        var reliability = input.reliability;
        var reliabilityClass = reliability ? this.mapReliability(reliability) : null; // Map reliability class if given
        var userURI = this.cleanPath(input.userURI);
        var queryType = input.queryType ? input.queryType : this.queryType; // Get default if not defined
        if (!userURI && reliability == 'confirmed')
            this.err = new Error("A user must be atrributed to a confirmed value. Please specify a userURI");
        if (!reliability)
            this.err = new Error("Reliability specification missing.");
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';
        var d = queryType != 'insert' ? '' : '\t';
        if (queryType == 'construct')
            q += '\nCONSTRUCT {\n';
        if (queryType == 'insert') {
            // FIRST DELETE CURRENT STATE CLASS FROM PREVIOUS STATE
            q += '\nDELETE {\n';
            if (!this.mainGraph)
                q += "\tGRAPH <" + host + "> {\n";
            q += b + "\t?previousState a opm:CurrentState .\n";
            if (!this.mainGraph)
                q += c;
            q += '}\n';
            q += 'INSERT {\n';
            if (!this.mainGraph)
                q += "\tGRAPH <" + host + "> {\n";
            q += b + "\t?previousState a opm:State .";
        }
        q += "" + b + d + "\t?propertyURI opm:hasState ?stateURI .\n";
        //Assign value directly to property when confirmed?
        //Mark property as confirmed?
        if (comment)
            q += "" + b + d + "\t?stateURI rdfs:comment \"" + comment + "\" .\n";
        q += "" + b + d + "\t?stateURI a opm:CurrentState , " + reliabilityClass + " ;\n";
        if (userURI)
            q += d + "\t\tprov:wasAttributedTo ?userURI ;\n";
        if (comment)
            q += d + "\t\trdfs:comment ?comment ;\n";
        q += "" + b + d + "\t\tprov:generatedAtTime ?now .\n";
        //Deleted states don't have a value
        if (reliability != 'deleted')
            q += '\t\t?stateURI opm:valueAtState ?value .\n';
        if (!this.mainGraph)
            q += c; // Named graph
        q += '}\n';
        q += 'WHERE {\n';
        q += a; // Named graph
        if (userURI)
            q += d + "\tBIND(" + userURI + " AS ?userURI)\n";
        if (comment)
            q += d + "\tBIND(\"" + comment + "\" AS ?comment)\n";
        //Set for specific propertyURI
        q += b + "\tBIND(<" + propertyURI + "> AS ?propertyURI)\n\n";
        //Get latest state
        //Make sure it is not deleted or confirmed and get data
        q += b + "\t# A STATE MUST EXIST AND MUST NOT BE DELETED OR CONFIRMED\n";
        q += b + "\t?propertyURI opm:hasState ?previousState .\n";
        q += b + "\t?previousState a opm:CurrentState ;\n";
        q += b + "\t\tprov:generatedAtTime ?t .\n";
        if (reliability != 'deleted')
            q += b + "\t?previousState opm:valueAtState ?value .\n\n";
        q += b + "\t# CAN'T CHANGE STATE IF DELETED OR CONFIRMED\n";
        q += b + "\tMINUS { ?previousState a opm:Deleted }\n";
        q += b + "\tMINUS { ?previousState a opm:Confirmed }\n\n";
        if (reliability == 'assumption') {
            q += b + "\t# CANNOT BE AN ASSUMPTION ALREADY\n";
            q += b + "\tMINUS { ?state a opm:Assumption }\n\n";
        }
        // Omit derived values (these are confirmed when all arguments are confirmed)
        q += b + "\t# A DERIVED PROPERTY CAN'T BE CONFIRMED - ARGUMENTS ARE CONFIRMED\n";
        q += b + "\tMINUS { ?state a opm:Derived }\n";
        q += b + "\tMINUS { ?state prov:wasDerivedFrom ?dependencies }\n\n";
        q += b + "\t# CREATE STATE URI\n";
        q += b + "\tBIND(REPLACE(STR(UUID()), \"urn:uuid:\", \"\") AS ?guid)\n";
        q += b + "\tBIND(URI(CONCAT(\"" + host + "\", \"State/\", ?guid)) AS ?stateURI)\n";
        q += b + "\tBIND(now() AS ?now)\n";
        if (!this.mainGraph)
            q += c; // Named graph
        q += '}';
        if (this.err) {
            q = 'Error: ' + this.err;
        }
        return q;
    };
    //Restore a deleted property
    OPMProp.prototype.restoreProp = function (input) {
        // Get global variables
        var host = this.host;
        var prefixes = this.prefixes;
        var mainGraph = this.mainGraph;
        // Optional variables
        var propertyURI = this.cleanURI(input.propertyURI); // Giving no propertyURI will restore everything!
        var queryType = input.queryType ? input.queryType : this.queryType; // Get default if not defined
        var userURI = this.cleanPath(input.userURI);
        var comment = input.comment;
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';
        var d = queryType != 'insert' ? '' : '\t';
        if (queryType == 'construct')
            q += '\nCONSTRUCT {\n';
        if (queryType == 'insert') {
            // FIRST DELETE CURRENT STATE CLASS FROM PREVIOUS STATE
            q += '\nDELETE {\n';
            if (!mainGraph)
                q += "\tGRAPH <" + host + "> {\n";
            q += b + "\t?previousState a opm:CurrentState .\n";
            if (!mainGraph)
                q += c;
            q += '}\n';
            q += 'INSERT {\n';
            if (!mainGraph)
                q += "\tGRAPH <" + host + "> {\n";
            q += b + "\t?previousState a opm:State .\n";
        }
        q += "" + b + d + "\t?propURI opm:hasState ?stateURI .\n";
        q += '\t?stateURI a opm:CurrentState ;\n';
        if (userURI)
            q += d + "\t\tprov:wasAttributedTo ?userURI ;\n";
        if (comment)
            q += d + "\t\trdfs:comment ?comment ;\n";
        q += '\t\tprov:generatedAtTime ?now ;\n';
        q += '\t\t?key ?val .\n';
        if (!this.mainGraph)
            q += c; // Named graph
        q += '}\n';
        q += 'WHERE {\n';
        q += a;
        if (userURI)
            q += d + "\tBIND(" + userURI + " AS ?userURI)\n";
        if (comment)
            q += d + "\tBIND(\"" + comment + "\" AS ?comment)\n";
        if (propertyURI)
            q += b + "\tBIND(" + propertyURI + " as ?propURI)\n\n";
        q += '\t# CREATE STATE URI\n';
        q += '\tBIND(REPLACE(STR(UUID()), "urn:uuid:", "") AS ?guid)\n';
        q += "\tBIND(URI(CONCAT(\"" + host + "\", \"State/\", ?guid)) AS ?stateURI)\n";
        q += '\tBIND(now() AS ?now)\n\n';
        //Get latest state
        q += b + "\t# GET THE TIME STAMP OF MOST RECENT PROPERTY THAT IS NOT DELETED\n";
        q += b + "\t{ SELECT ?propURI (MAX(?_t) AS ?t) WHERE {\n";
        q += b + "\t\t?propURI opm:hasState ?state .\n";
        q += b + "\t\t?state prov:generatedAtTime ?_t .\n";
        q += b + "\t\tMINUS { ?state a opm:Deleted }\n";
        q += b + "\t} GROUP BY ?propURI }\n\n";
        //Get data
        q += b + "\t#GET DATA\n";
        q += b + "\t?propURI opm:hasState [\n";
        q += b + "\t\tprov:generatedAtTime ?t ;\n";
        q += b + "\t\t?key ?val\n";
        q += b + "\t]\n\n";
        q += b + "\t# DON NOT RESTORE GENERATION TIME\n";
        q += b + "\tFILTER(?key != prov:generatedAtTime)\n\n";
        if (queryType != 'construct') {
            q += b + "\t# GET DELETED STATE\n";
            q += b + "\t?propURI seas:evaluation ?previousState .\n";
            q += b + "\t?previousState a opm:CurrentState .\n\n";
        }
        if (!this.mainGraph)
            q += c; // Named graph
        q += '}';
        return q;
    };
    // Get one or more properties
    // Return either for a specific FoI or for all FoIs
    // Return a specific property by defining the property argument
    // Return a specific propertyURI by defining the propertyURI argument
    // Return only the latest state(s) by setting argument latest = true
    // Return select variables by setting argument queryType = 'select'
    // Return graph subset (construct query) by setting argument queryType = 'construct'
    // Restrict to either 'deleted', 'assumptions', 'derived' or 'confirmed'
    OPMProp.prototype.getProps = function (input) {
        // Get global variables
        var prefixes = this.prefixes;
        // Process input
        var foiURI = this.cleanURI(input.foiURI);
        var property = this.cleanURI(input.property);
        var propertyURI = this.cleanURI(input.propertyURI);
        //Queries all properties as default - else queries a specific property or FoI
        var strLang = (input && input.language) ? input.language : 'en';
        var latest = input.latest;
        var restriction = input.restriction;
        var queryType = input.queryType ? input.queryType : this.queryType;
        //Find restriction class
        if (restriction) {
            var restrictionClass = _.chain(this.reliabilityOptions).filter(function (obj) { return (obj.key == restriction); }).map(function (obj) { return obj.class; }).first().value();
        }
        var q = '';
        //Define prefixes
        for (var i in prefixes) {
            q += "PREFIX  " + prefixes[i].prefix + ": <" + prefixes[i].uri + "> \n";
        }
        if (queryType == 'construct') {
            q += '\nCONSTRUCT {\n';
            q += '\t?foi ?property ?propertyURI .\n';
            q += '\t?propertyURI opm:hasState ?state ';
            q += this.mainGraph ? '.\n' : ';\n\t\tsd:namedGraph ?g .\n';
            q += '\t?state prov:generatedAtTime ?ts ;\n';
            q += '\t\ta ?stateClasses ;\n';
            q += '\t\topm:valueAtState ?value .\n';
            q += '}\n';
        }
        else {
            q += "SELECT DISTINCT ?foi ?property ?propertyURI ?value (?ts AS ?timestamp) (?state AS ?stateURI) ?label (?g AS ?graphURI)\n";
        }
        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';
        q += "WHERE {\n";
        q += a; // Named graph
        //If querying for a specific FoI
        if (foiURI)
            q += b + "\tBIND(" + foiURI + " AS ?foi)\n";
        //If querying for a specific property type
        if (property)
            q += b + "\tBIND(" + property + " AS ?property)\n";
        //If querying for a specific property
        if (propertyURI)
            q += b + "\tBIND(" + propertyURI + " AS ?propertyURI)\n";
        q += "\n";
        q += b + "\t?foi ?property ?propertyURI .\n";
        q += b + "\t?propertyURI opm:hasState ?state .\n\n";
        if (latest) {
            q += b + "\t# GET ONLY THE LATEST STATE\n";
            q += b + "\t?state a opm:CurrentState .\n\n";
        }
        q += b + "\t?state prov:generatedAtTime ?ts ;\n";
        q += b + "\t\ta ?stateClasses .\n";
        q += b + "\tOPTIONAL{ ?state opm:valueAtState ?value . }\n\n";
        // If restriction = deleted or querying for the full history, return also the opm:Deleted
        if (restriction != 'deleted' && latest) {
            q += b + "\t# FILTER OUT DELETED PROPERTIES\n";
            q += b + "\tMINUS{ ?state a opm:Deleted }\n\n";
        }
        if (restriction) {
            q += b + "\t# RESTRICT VALUES\n";
            q += b + "\t?state a " + restrictionClass + " .\n";
        }
        // q+= `\t#RETRIEVE LABEL FROM ONTOLOGY IF AVAILABLE\n`;
        // q+= `\tOPTIONAL{\n`;
        // q+= `\t\tGRAPH ?gy {\n`;
        // q+= `\t\t\t?property rdfs:label ?propertyLabel\n`;
        // q+= `\t\t\tFILTER(lang(?propertyLabel)="${strLang}")\n`;
        // q+= '\t\t}\n';
        // q+= '\t}\n';
        q += c; // Named graph
        q += '}';
        return q;
    };
    return OPMProp;
})(base_1.BaseModel);
exports.OPMProp = OPMProp;

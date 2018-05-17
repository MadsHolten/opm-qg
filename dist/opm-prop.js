"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var _ = require("lodash");
var _s = require("underscore.string");
var base_1 = require("./base");
var OPMProp = /** @class */ (function (_super) {
    __extends(OPMProp, _super);
    function OPMProp() {
        return _super !== null && _super.apply(this, arguments) || this;
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
            property: property,
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
            property: property,
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
            property: property,
            value: value,
            reliability: reliability,
            userURI: userURI,
            comment: comment,
            queryType: 'insert'
        };
        return this.putProp(input);
    };
    /**
     * PUT BY PATH INSERT QUERY
     * Update a property of a specific FoI
     * @param foiURI        URI of the Feature of Interest (FoI) holding the property that is to be updated
     * @param property      URI of the property
     * @param value         value of the property
     * @param reliability   reliability (optional)
     * @param userURI       URI of the user who assigned the property (optional)
     * @param comment       comment - why was it assigned? (optional)
     */
    OPMProp.prototype.putByPath = function (path, property, value, reliability, userURI, comment) {
        var input = {
            host: this.host,
            path: path,
            property: property,
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
    OPMProp.prototype.getFoIProps = function (foiURI, property, queryType) {
        if (!queryType)
            queryType = 'construct';
        var input = {
            foiURI: foiURI,
            property: property,
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
        // Retrieve and process variables
        var property = input.property;
        var value = input.value;
        // Optional arguments
        var foiURI = this.cleanURI(input.foiURI);
        var path = input.path ? this.cleanPath(input.path) : '?foi ?p ?o .\n';
        var reliability = input.reliability;
        var userURI = this.cleanURI(input.userURI);
        var comment = input.comment;
        var reliabilityClass = reliability ? this.mapReliability(reliability) : null; // Map reliability class if given
        var queryType = input.queryType ? input.queryType : this.queryType; // Get default if not defined
        // Validate arguments
        if (!foiURI && !input.path)
            return new Error("Specify either a foiURI or a path");
        if (!property)
            return new Error('Specify a property');
        if (!value)
            return new Error('Specify a value');
        if (reliabilityClass instanceof Error)
            return reliabilityClass;
        //Clean property (add triangle brackets if not prefixed)
        property = _s.startsWith(property, 'http') ? "<" + property + ">" : "" + property;
        var q = '';
        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : "\tGRAPH ?g {\n";
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
        q += d + "\t?foi " + property + " ?propertyURI .\n" +
            (d + "\t?propertyURI a opm:Property ;\n") +
            (d + "\t\tseas:evaluation ?stateURI .\n");
        if (reliabilityClass)
            q += d + "\t?stateURI a " + reliabilityClass + " .\n";
        q += d + "\t?stateURI a opm:CurrentState ;\n";
        if (userURI)
            q += d + "\t\tprov:wasAttributedTo ?userURI ;\n";
        if (comment)
            q += d + "\t\trdfs:comment ?comment ;\n";
        q += d + "\t\topm:valueAtState ?val ;\n" +
            (d + "\t\tprov:generatedAtTime ?now .\n");
        if (!this.mainGraph && queryType == 'insert')
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
        q += b + "\t# THE FoI CANNOT HAVE THE PROPERTY ASSIGNED ALREADY\n" +
            (b + "\tMINUS { ?foi " + property + " ?prop . }\n\n") +
            (b + "\t# CREATE STATE AND PROPERTY URIs\n") +
            (b + "\tBIND(URI(CONCAT(\"" + host + "\", \"state_\", STRUUID())) AS ?stateURI)\n") +
            (b + "\tBIND(URI(CONCAT(\"" + host + "\", \"property_\", STRUUID())) AS ?propertyURI)\n") +
            (b + "\tBIND(now() AS ?now)\n");
        q += c;
        q += "}";
        return this.appendPrefixesToQuery(q);
    };
    // Update FoI property
    OPMProp.prototype.putProp = function (input) {
        // Get global variables
        var host = this.host;
        // Retrieve and process variables
        var value = input.value;
        // Optional
        var propertyURI = this.cleanURI(input.propertyURI); // OPTION 1
        var foiURI = this.cleanURI(input.foiURI); // OPTION 2
        var property = input.property; // OPTION 2
        var path = this.cleanPath(input.path); // OPTION 3
        var reliability = input.reliability;
        var reliabilityClass = reliability ? this.mapReliability(reliability) : null; // Map reliability class if given
        var userURI = this.cleanURI(input.userURI);
        var comment = input.comment;
        var queryType = input.queryType ? input.queryType : this.queryType; // Get default if not defined
        // Either foiURI/property pair, propertyURI or path must be specified
        if (!path && !propertyURI) {
            if (foiURI && !property)
                return new Error("Specify a property to be assigned to the FoI");
            if (!foiURI && property)
                return new Error("Specify a FoI to assign the property to");
        }
        else if (!path) {
            if (!propertyURI)
                return new Error("Specify a property URI");
        }
        else if (!path) {
            return new Error("Specify either a path, a foiURI/property pair or a propertyURI");
        }
        if (reliabilityClass instanceof Error)
            return reliabilityClass;
        // Clean property (add triangle brackets if not prefixed)
        property = _s.startsWith(property, 'http') ? "<" + property + ">" : "" + property;
        var q = '';
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
            q += d + "\t?previousState a opm:CurrentState .\n";
            if (!this.mainGraph)
                q += c;
            q += '}\n';
            q += 'INSERT {\n';
            if (!this.mainGraph)
                q += "\tGRAPH <" + host + "> {\n";
            q += d + "\t?previousState a opm:State .";
        }
        q += d + "\t?propertyURI seas:evaluation ?stateURI .\n";
        q += d + "\t?stateURI a opm:CurrentState";
        q += reliabilityClass ? " , " + reliabilityClass + " ;\n" : " ;\n";
        if (userURI)
            q += d + "\t\tprov:wasAttributedTo ?userURI ;\n";
        if (comment)
            q += d + "\t\trdfs:comment ?comment ;\n";
        q += d + "\t\topm:valueAtState ?val ;\n" +
            (d + "\t\tprov:generatedAtTime ?now .\n");
        if (!this.mainGraph && queryType == 'insert')
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
        if (path)
            q += "\t\t\t" + path + "\n\n";
        q += b + "\t# GET DATA FROM LATEST STATE\n";
        if (!propertyURI)
            q += b + "\t?foi " + property + " ?propertyURI .\n";
        q += b + "\t?propertyURI seas:evaluation ?previousState .\n" +
            (b + "\t?previousState a opm:CurrentState ;\n") +
            (b + "\t\t\topm:valueAtState ?previousVal .\n\n");
        q += b + "\t# FILTER OUT DELETED OR CONFIRMED\n" +
            (b + "\tMINUS{ ?previousState a opm:Deleted }\n") +
            (b + "\tMINUS{ ?previousState a opm:Confirmed }\n\n") +
            (b + "\t# VALUE SHOULD BE DIFFERENT FROM THE PREVIOUS\n") +
            (b + "\tFILTER(?previousVal != ?val)\n") +
            (b + "\t# CREATE STATE URIs\n") +
            (b + "\tBIND(URI(CONCAT(\"" + host + "\", \"state_\", STRUUID())) AS ?stateURI)\n") +
            (b + "\tBIND(now() AS ?now)\n");
        q += c; // Named graph
        q += "}";
        return this.appendPrefixesToQuery(q);
    };
    //Set reliability
    //Make it an assumption or a confirmed property
    //Also possible to delete it
    OPMProp.prototype.setReliability = function (input) {
        // Get global variables
        var host = this.host;
        // Retrieve and process variables
        var comment = input.comment;
        var propertyURI = this.cleanURI(input.propertyURI);
        var reliability = input.reliability;
        var reliabilityClass = reliability ? this.mapReliability(reliability) : null; // Map reliability class if given
        var userURI = this.cleanURI(input.userURI);
        var queryType = input.queryType ? input.queryType : this.queryType; // Get default if not defined
        // Validate input
        if (!userURI && reliability == 'confirmed')
            return new Error("A user must be atrributed to a confirmed value. Please specify a userURI");
        if (!reliability)
            return new Error("Reliability specification missing");
        if (reliability == 'derived')
            return new Error("opm:Derived can not be set explicitly as it is reserved for properties that are derived");
        if (reliabilityClass instanceof Error)
            return reliabilityClass;
        var q = '';
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
            q += d + "\t?previousState a opm:CurrentState .\n";
            if (!this.mainGraph)
                q += c;
            q += '}\n' +
                'INSERT {\n';
            if (!this.mainGraph)
                q += "\tGRAPH <" + host + "> {\n";
            q += d + "\t?previousState a opm:State .\n";
        }
        q += d + "\t?propertyURI seas:evaluation ?stateURI .\n";
        //Assign value directly to property when confirmed?
        //Mark property as confirmed?
        if (comment)
            q += d + "?stateURI rdfs:comment \"" + comment + "\" .\n";
        q += d + "\t?stateURI a opm:CurrentState , ?reliabilityClass ;\n" +
            (d + "\t\t?key ?val ;\n");
        if (userURI)
            q += d + "\t\tprov:wasAttributedTo ?userURI ;\n";
        if (comment)
            q += d + "\t\trdfs:comment ?comment ;\n";
        q += d + "\t\tprov:generatedAtTime ?now .\n";
        if (!this.mainGraph && queryType == 'insert')
            q += c;
        q += '}\n' +
            'WHERE {\n';
        q += a; // Named graph
        if (userURI)
            q += b + "\tBIND(" + userURI + " AS ?userURI)\n";
        if (comment)
            q += b + "\tBIND(\"" + comment + "\" AS ?comment)\n";
        //Set for specific propertyURI
        q += b + "\tBIND(" + propertyURI + " AS ?propertyURI)\n" +
            (b + "\tBIND(" + reliabilityClass + " AS ?reliabilityClass)\n\n");
        q += b + "\t# CREATE URI FOR NEW STATE\n" +
            (b + "\tBIND(URI(CONCAT(\"" + host + "\", \"state_\", STRUUID())) AS ?stateURI)\n") +
            (b + "\tBIND(now() AS ?now)\n\n");
        //Make sure latest state it is not deleted or confirmed and get data
        q += b + "\t# A STATE MUST EXIST AND MUST NOT BE DELETED OR CONFIRMED\n" +
            (b + "\t?propertyURI seas:evaluation ?previousState .\n") +
            (b + "\t?previousState a opm:CurrentState ;\n") +
            (b + "\t\t?key ?val .\n\n") +
            (b + "\t# PREVIOUS OPM CLASSES SHOULD NOT BE COPIED\n") +
            (b + "\tFILTER(namespace(?val) != \"https://w3id.org/opm#\")\n\n") +
            (b + "\t# CANNOT CHANGE STATE IF DELETED OR CONFIRMED\n") +
            (b + "\tMINUS { ?previousState a opm:Deleted }\n") +
            (b + "\tMINUS { ?previousState a opm:Confirmed }\n\n") +
            (b + "\t# SHOULD BE DIFFERENT FROM PREVIOUS STATE\n") +
            (b + "\tMINUS { ?previousState a ?reliabilityClass }\n\n") +
            (
            // Omit derived values (these are confirmed when all arguments are confirmed)
            b + "\t# RELIABILITY OF A DERIVED PROPERTY CANNOT BE SET - IT IS INFERRED\n") +
            (b + "\tMINUS { ?state a opm:Derived }\n") +
            (b + "\tMINUS { ?state prov:wasDerivedFrom ?dependencies }\n\n");
        if (!this.mainGraph)
            q += c; // Named graph
        q += '}';
        return this.appendPrefixesToQuery(q);
    };
    //Restore a deleted property
    OPMProp.prototype.restoreProp = function (input) {
        // Get global variables
        var host = this.host;
        var mainGraph = this.mainGraph;
        // Optional variables
        var propertyURI = this.cleanURI(input.propertyURI); // Giving no propertyURI will restore everything!
        var queryType = input.queryType ? input.queryType : this.queryType; // Get default if not defined
        var userURI = this.cleanPath(input.userURI);
        var comment = input.comment;
        var q = '';
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
            q += d + "\t?previousState a opm:CurrentState .\n";
            if (!mainGraph)
                q += c;
            q += '}\n' +
                'INSERT {\n';
            if (!mainGraph)
                q += "\tGRAPH <" + host + "> {\n";
            q += d + "\t?previousState a opm:State .\n";
        }
        q += d + "\t?propURI seas:evaluation ?stateURI .\n";
        q += '\t?stateURI a opm:CurrentState ;\n';
        if (userURI)
            q += d + "\t\tprov:wasAttributedTo ?userURI ;\n";
        if (comment)
            q += d + "\t\trdfs:comment ?comment ;\n";
        q += '\t\tprov:generatedAtTime ?now ;\n' +
            '\t\t?key ?val .\n';
        if (!this.mainGraph && queryType == 'insert')
            q += c;
        q += '}\n' +
            'WHERE {\n';
        q += a;
        if (userURI)
            q += b + "\tBIND(" + userURI + " AS ?userURI)\n";
        if (comment)
            q += b + "\tBIND(\"" + comment + "\" AS ?comment)\n";
        if (propertyURI)
            q += b + "\tBIND(" + propertyURI + " as ?propURI)\n\n";
        q += b + "\t# CREATE STATE URI\n" +
            (b + "\tBIND(URI(CONCAT(\"" + host + "\", \"state_\", STRUUID())) AS ?stateURI)\n") +
            (b + "\tBIND(now() AS ?now)\n\n") +
            (
            //Get latest state
            b + "\t# GET THE TIME STAMP OF MOST RECENT PROPERTY THAT IS NOT DELETED\n") +
            (b + "\t{ SELECT ?propURI (MAX(?_t) AS ?t) WHERE {\n") +
            (b + "\t\t?propURI seas:evaluation ?state .\n") +
            (b + "\t\t?state prov:generatedAtTime ?_t .\n") +
            (b + "\t\tMINUS { ?state a opm:Deleted }\n") +
            (b + "\t} GROUP BY ?propURI }\n\n") +
            (
            //Get data
            b + "\t#GET DATA\n") +
            (b + "\t?propURI seas:evaluation [\n") +
            (b + "\t\tprov:generatedAtTime ?t ;\n") +
            (b + "\t\t?key ?val ] .\n\n") +
            (b + "\t# DON NOT RESTORE GENERATION TIME AND DELETED CLASS\n") +
            (b + "\tFILTER(?key != prov:generatedAtTime)\n") +
            (b + "\tFILTER(?val != opm:Deleted)\n\n");
        if (queryType != 'construct') {
            q += b + "\t# GET DELETED STATE\n";
            q += b + "\t?propURI seas:evaluation ?previousState .\n";
            q += b + "\t?previousState a opm:CurrentState .\n\n";
        }
        if (!this.mainGraph)
            q += c; // Named graph
        q += '}';
        return this.appendPrefixesToQuery(q);
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
            var restrictionClass = _.chain(this.reliabilityOptions).filter(function (obj) { return (obj.key == restriction); }).map(function (obj) { return obj["class"]; }).first().value();
        }
        var q = '';
        if (queryType == 'construct') {
            q += '\nCONSTRUCT {\n' +
                '\t?foi ?property ?propertyURI .\n' +
                '\t?propertyURI seas:evaluation ?stateURI ';
            q += this.mainGraph ? '.\n' : ';\n\t\tsd:namedGraph ?g .\n';
            q += '\t?stateURI prov:generatedAtTime ?ts ;\n' +
                '\t\ta ?stateClasses ;\n' +
                '\t\topm:valueAtState ?value .\n' +
                '}\n';
        }
        else {
            q += "SELECT DISTINCT ?foi ?property ?propertyURI ?value (?ts AS ?timestamp) ?stateURI ?label (?g AS ?graphURI)\n";
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
        q += b + "\t?foi ?property ?propertyURI .\n" +
            (b + "\t?propertyURI seas:evaluation ?stateURI .\n");
        if (latest) {
            q += b + "\t# GET ONLY THE LATEST STATE\n" +
                (b + "\t?stateURI a opm:CurrentState .\n\n");
        }
        q += b + "\t?stateURI prov:generatedAtTime ?ts ;\n" +
            (b + "\t\ta ?stateClasses .\n") +
            (b + "\tOPTIONAL{ ?stateURI opm:valueAtState ?value . }\n\n");
        // If restriction = deleted or querying for the full history, return also the opm:Deleted
        if (restriction != 'deleted' && latest) {
            q += b + "\t# FILTER OUT DELETED PROPERTIES\n" +
                (b + "\tMINUS{ ?state a opm:Deleted }\n\n");
        }
        if (restriction) {
            q += b + "\t# RESTRICT VALUES\n" +
                (b + "\t?state a " + restrictionClass + " .\n");
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
        return this.appendPrefixesToQuery(q);
    };
    return OPMProp;
}(base_1.BaseModel));
exports.OPMProp = OPMProp;

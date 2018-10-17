"use strict";
exports.__esModule = true;
var _ = require("lodash");
var _s = require("underscore.string");
var BaseModel = /** @class */ (function () {
    function BaseModel(host, prefixes, mainGraph, iGraph) {
        // Get host
        this.host = host;
        // Get predefined prefixes
        this.prefixes = require('./config.json').prefixes;
        // Append custom prefixes
        if (prefixes) {
            this.prefixes = this._concatenatePrefixes(prefixes);
        }
        // Default query type is construct
        this.queryType = 'construct';
        // Query main graph as default
        this.mainGraph = mainGraph != undefined ? mainGraph : true;
        // Inference graph defaults to host+I
        this.iGraph = iGraph ? iGraph : this.host + 'I';
    }
    BaseModel.prototype.addPrefix = function (prefix) {
        this.prefixes = this._concatenatePrefixes([prefix]);
    };
    BaseModel.prototype.getPrefixes = function () {
        return this.prefixes;
    };
    // Convert prefixes to JSON-LD context file format
    BaseModel.prototype.getJSONLDContext = function () {
        var context = {};
        _.each(this.prefixes, function (x) {
            context[x.prefix] = x.uri;
        });
        return context;
    };
    BaseModel.prototype.mapReliability = function (reliability) {
        // Get reliability mappings
        var mappings = require('./config.json').reliabilityMappings;
        // Derived can not be set as it is only inferred for derived properties
        var options = _.filter(mappings, function (obj) { return (obj.key != 'derived'); });
        // Return error if 
        if (!_.chain(options).filter(function (obj) { return (obj.key == reliability); }).first().value()) {
            var err = "Unknown restriction. Use either " + _s.toSentence(_.map(options, function (o) { return o.key; }), ', ', ' or ');
            return new Error(err);
        }
        // Map and return class
        return _.chain(options).filter(function (obj) { return (obj.key == reliability); }).map(function (obj) { return obj["class"]; }).first().value();
    };
    // Concatenate new and predefined prefixes while filtering out duplicates
    BaseModel.prototype._concatenatePrefixes = function (newPrefixes) {
        var prefixes = this.prefixes;
        if (newPrefixes) {
            prefixes = prefixes.concat(newPrefixes);
            //Remove duplicates
            return _.map(_.groupBy(prefixes, function (obj) {
                return obj.prefix;
            }), function (grouped) {
                return grouped[0];
            });
        }
    };
    BaseModel.prototype.cleanPath = function (path) {
        if (!path)
            return undefined;
        // Trim spaces before and after
        path = path.trim();
        // Make array with sub-parts of path
        var el = path.split(' ');
        // Get subject and change it to ?foi if it is not already defined so
        if (el[0] != '?foi')
            path = path.replace(el[0], '?foi');
        // Make sure that it ends with a .
        if (path[path.length - 1] != '.')
            path = path + ' .';
        // Break at .
        path = path.replace('.', '.\n');
        // Break and indent at ;
        path = path.replace(';', ';\n\t\t');
        return path;
    };
    // Extracts the unique SPARQL variables from a string
    // Optionally, give it an array to include in the search
    BaseModel.prototype.uniqueVarsInString = function (str, array) {
        if (!array)
            array = [];
        var regex = /\?[a-zA-Z0-9]+/g;
        var m;
        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            // The result can be accessed through the `m`-variable.
            m.forEach(function (match, groupIndex) {
                if (array.indexOf(match) == -1) {
                    array.push(match);
                }
            });
        }
        return array;
    };
    BaseModel.prototype.nameSpacesInQuery = function (str) {
        var array = [];
        var regex = /[a-zA-Z]+\:/g;
        var m;
        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            // The result can be accessed through the `m`-variable.
            m.forEach(function (match, groupIndex) {
                match = match.slice(0, -1);
                if (array.indexOf(match) == -1) {
                    array.push(match);
                }
            });
        }
        return array;
    };
    /**
     *
     * @param query
     * 1) Extract all namespaces used in the query using nameSpacesInQuery()
     * 2) Get URIs from match with this.prefixes
     * 3) Create string in form `PREFIX pfx: <someURI>`
     */
    BaseModel.prototype.appendPrefixesToQuery = function (query) {
        var _this = this;
        // Extract namespaces used in the query
        var namespaces = this.nameSpacesInQuery(query);
        // Get the URIs of the prefixes and append them to the query
        var p = '';
        _.each(namespaces, function (ns) {
            var match = _.filter(_this.prefixes, function (pfx) { return pfx.prefix == ns; })[0];
            if (match) {
                p += "PREFIX  " + ns + ": <" + match.uri + ">\n";
            }
            else {
                return new Error('Unknown prefix ' + ns);
            }
        });
        return p + query;
    };
    // Clean argument paths and return the variables used for the arguments
    BaseModel.prototype.cleanArgPaths = function (paths) {
        var vars = [];
        // Argument paths should not include space and dot in end
        paths = _.chain(paths).map(function (path) {
            //Find the first variable
            var firstVar = '?' + _s.strLeft(_s.strRight(path, '?'), ' ');
            if (firstVar != '?foi') {
                path = path.replace(firstVar, '?foi');
            }
            return path;
        }).map(function (path) {
            //Find last variable
            var lastVar = '?' + _s.strRightBack(path, '?');
            //remove things after space if any
            if (_s.contains(lastVar, ' ')) {
                vars.push(_s.strLeftBack(lastVar, ' '));
                return _s.strLeftBack(path, ' ');
            }
            vars.push(lastVar);
            return path;
        }).value();
        return { paths: paths, vars: vars };
    };
    // clean URI by adding <> if it is a full URI
    BaseModel.prototype.cleanURI = function (someURI) {
        if (!someURI)
            return undefined;
        // If it doesn't contain http, just return it as is
        if (someURI.indexOf('http') == -1) {
            return someURI;
            // If not and it already has <> just return as is
        }
        else if (someURI[0] == '<' && someURI[someURI.length - 1] == '>') {
            return someURI;
        }
        else {
            return "<" + someURI + ">";
        }
    };
    /**
     * CLEAN STRING
     * Strings can be either defined just as the text or as text + language/datatype "text"@en / "text"^^xsd:string
     * @param string test string to clean
     */
    BaseModel.prototype.cleanLiteral = function (string) {
        if (!string)
            return undefined;
        // If begins with "
        if (string[0] == '"') {
            return string;
        }
        else {
            return "\"" + string + "\"";
        }
    };
    BaseModel.prototype.cleanProp = function (string) {
        // Handle properties that are not in quotation marks
        if (!string.startsWith('"')) {
            string = "\"" + string + "\"";
        }
        // Process line breaks
        var s = string.replace(/\n/g, '\\n');
        // Process quotation marks
        // Get string between outer quotation marks
        var subString = s.substring(s.indexOf('"') + 1, s.lastIndexOf('"'));
        // If there are quotation marks inside the outer quotation marks these are replaced with '
        if (subString && subString.indexOf('"') != -1) {
            var newString = subString.replace(/\"/g, "'");
            s = s.replace(subString, newString);
        }
        console.log(s);
        return s;
    };
    return BaseModel;
}());
exports.BaseModel = BaseModel;

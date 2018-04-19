var _ = require("underscore");
var _s = require("underscore.string");
var BaseModel = (function () {
    function BaseModel(host, prefixes, mainGraph) {
        // Get host
        this.host = host;
        // Get predefined prefixes
        this.prefixes = require('../config.json').prefixes;
        // Append custom prefixes
        if (prefixes) {
            this.prefixes = this._concatenatePrefixes(prefixes);
        }
        // Default query type is construct
        this.queryType = 'construct';
        // Query main graph as default
        this.mainGraph = mainGraph != undefined ? mainGraph : true;
    }
    BaseModel.prototype.addPrefix = function (prefix) {
        this.prefixes = this._concatenatePrefixes([prefix]);
    };
    BaseModel.prototype.mapReliability = function (reliability) {
        // Get reliability mappings
        var mappings = require('../config.json').reliabilityMappings;
        // Derived can not be set as it is only inferred for derived properties
        var options = _.filter(mappings, function (obj) { return (obj.key != 'derived'); });
        // Return error if 
        if (!_.chain(options).filter(function (obj) { return (obj.key == reliability); }).first().value()) {
            var err = "Unknown restriction. Use either " + _s.toSentence(_.pluck(options, 'key'), ', ', ' or ');
            return new Error(err);
        }
        // Map and return class
        return _.chain(options).filter(function (obj) { return (obj.key == reliability); }).map(function (obj) { return obj.class; }).first().value();
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
        var regex = /\?[a-zA-Z]+/g;
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
    // Clean argument paths and return the variables used for the arguments
    BaseModel.prototype.cleanArgPaths = function (paths) {
        var vars = [];
        // Argument paths should not include space and dot in end
        var paths = _.chain(paths).map(function (path) {
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
        }
        else if (someURI[0] == '<' && someURI[someURI.length - 1] == '>') {
            return someURI;
        }
        else {
            return "<" + someURI + ">";
        }
    };
    return BaseModel;
})();
exports.BaseModel = BaseModel;

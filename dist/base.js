"use strict";
var _ = require("underscore");
var BaseModel = (function () {
    function BaseModel() {
        //Predefined prefixes
        this.prefixes = [
            { prefix: 'rdf', uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' },
            { prefix: 'xsd', uri: 'http://www.w3.org/2001/XMLSchema#' },
            { prefix: 'prov', uri: 'http://www.w3.org/ns/prov#' },
            { prefix: 'opm', uri: 'https://w3id.org/opm#' },
            { prefix: 'seas', uri: 'https://w3id.org/seas/' },
            { prefix: 'sd', uri: 'http://www.w3.org/ns/sparql-service-description#' }
        ];
        //Default query type is construct
        this.queryType = 'construct';
        //Reliability options
        this.reliabilityOptions = [
            { 'key': 'deleted', 'class': 'opm:Deleted' },
            { 'key': 'assumption', 'class': 'opm:Assumption' },
            { 'key': 'derived', 'class': 'opm:Derived' },
            { 'key': 'confirmed', 'class': 'opm:Confirmed' }
        ];
    }
    //Concatenate new and predefined prefixes while filtering out duplicates
    BaseModel.prototype.concatenatePrefixes = function (newPrefixes) {
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
    return BaseModel;
}());
exports.BaseModel = BaseModel;

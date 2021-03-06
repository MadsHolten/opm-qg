"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 4
 * add/update property for all FoIs matching a pattern
 * 
 * A pattern is given as a triple pattern, and it must
 * start with the FoI itself using the "?foi"
 * variable.
 * The following variables are reserved, and cannot be
 * included in the pattern:
 * ?propertyURI, ?evaluationURI, ?now, ?val, ?guid, ?eval
 * 
 * In the example a 'seas:fluidSupplyTemperature' is
 * set to 70 Cel for all FoIs of type 'seas:HeatingSystem'
 */
var input = {
    inferredProperty: 'https://w3id.org/seas/fluidReturnTemperature',
    value: {
        value: '70 Cel',
        datatype: 'cdt:ucum'
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ],
    pattern: '?foi a seas:HeatingSystem',
    reliability: 'assumption'
};
var sc = new qg.OPMProp();
var q = sc.putFoIProp(input);
//var q = sc.putFoIProp();
console.log(q);
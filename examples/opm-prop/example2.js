"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 2
 * add property to all resources matching a pattern
 * 
 * A pattern is given as a triple pattern, and it must
 * start with the resource itself using the "?resource"
 * variable.
 * The following variables are reserved, and cannot be
 * included in the pattern:
 * ?propertyURI, ?evaluationURI, ?now, ?val, ?guid, ?eval
 * 
 * In the example a 'seas:fluidSupplyTemperature' is
 * added to all resources of type 'seas:HeatingSystem'
 */
var input = {
    value: {
        unit: 'Cel',
        datatype: 'cdt:ucum',
        property: 'seas:fluidSupplyTemperature',
        value: '70'
    },
    hostURI: 'https://host/proj',
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ],
    pattern: '?resource a seas:HeatingSystem'
};
var sc = new qg.OPMProp(input);
var q = sc.postProp();
console.log(q);
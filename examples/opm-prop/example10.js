"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 10
 * Update an existing property.
 * Will not update if it is deleted or confirmed.
 */
var input = {
    propertyURI: 'https://localhost/opm/Property/daca99d8-3607-4366-bc15-caca9f688b05',
    userURI: 'https://niras.dk/employees/mhra',
    reliability: 'assumption',
    value: {
        unit: 'Cel',
        datatype: 'cdt:ucum',
        property: 'seas:fluidSupplyTemperature',
        value: '72'
    },
    prefixes: [
        { prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#' }
    ]
};
var sc = new qg.OPMProp(input);
var q = sc.putProp();
console.log(q);
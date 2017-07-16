"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 10
 * State a property as an assumption
 */
var input = {
    propertyURI: 'https://localhost/opm/Property/3b5b00d8-9bcc-4a58-aba2-df059b5ded97',
    userURI: 'https://niras.dk/employees/mhra'
};
var sc = new qg.OPMProp(input);
var q = sc.makeAssumption();
console.log(q);
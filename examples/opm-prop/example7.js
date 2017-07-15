"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 7
 * delete a property by adding a new state with
 * the property opm:deleted set to true
 */
var input = {
    propertyURI: 'https://localhost/opm/Property/3b5b00d8-9bcc-4a58-aba2-df059b5ded97'
};
var sc = new qg.OPMProp(input);
var q = sc.deleteProp();
console.log(q);
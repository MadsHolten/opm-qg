"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 8
 * Get latest evaluation of a specific property
 * 
 */
var input = {
    propertyURI: 'https://localhost/opm/Property/52195746-4b64-40fc-99ca-5090ed11af8d'
};
var sc = new qg.OPMProp();
var q = sc.deleteProp(input);
console.log(q);
"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 4
 * Get latest evaluation of a specific property
 * 
 */
var input = {
    propertyURI: "https://localhost/opm/Property/3b5b00d8-9bcc-4a58-aba2-df059b5ded97",
    latest: true
};
var sp = new qg.OPMProp();
var q = sp.getProps(input);
console.log(q);
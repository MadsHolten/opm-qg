"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 5
 * Get latest evaluation of a specific property
 * 
 */
var input = {
    propertyURI: "https://localhost/opm/Property/3b5b00d8-9bcc-4a58-aba2-df059b5ded97",
    latest: true
};
var sc = new qg.OPMProp(input);
var q = sc.getProp();
console.log(q);
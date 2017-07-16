"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 3
 * Get latest evaluation and value of all properties
 */
var input = {
    resourceURI: "https://localhost/opm/HeatingSystem/1",
    language: "en"
};
var sc = new qg.OPMProp(input);
var q = sc.getResourceProps();
console.log(q);
"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 3
 * Get latest evaluation and value of all properties
 */
var input = {
    foiURI: "https://localhost/opm/HeatingSystem/908df30e-3678-431a-b60f-8b8bc49d799c",
    language: "en",
    latest: "true"
};
var sc = new qg.OPMProp();
var q = sc.getProps(input);
console.log(q);
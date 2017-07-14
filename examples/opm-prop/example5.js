"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 5
 * Get latest evaluation and value of all properties
 * 
 * 
 */
var input = {
    resourceURI: "https://localhost/seas/HeatingSystem/f9a64795-58b6-4d6d-9755-e56920923db8",
    language: "en"
};
var sc = new qg.OPMProp(input);
var q = sc.getProps();
console.log(q);
"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 4
 * List outdated calculations
 * 
 * Outdated calculations are calculations where one
 * or more of the arguments have changed since last
 * time the calculation was performed.
 * 
 * Either return a full list or a list with properties
 * of a specific FoI (as shown in example)
 */
var input = {
    foiURI: 'https://localhost/opm/HeatingSystem/1',
    queryType: 'construct'
};
var sc = new qg.OPMCalc;
var q = sc.listOutdated(input);
console.log(q);
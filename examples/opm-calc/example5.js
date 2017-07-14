"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 5
 * List outdated calculations
 * 
 * Outdated calculations are calculations where one
 * or more of the arguments have changed since last
 * time the calculation was performed.
 * 
 * Either return a full list or a list with properties
 * of a specific resource (as shown in example)
 */
var input = {
    resourceURI: 'https://localhost/seas/HeatingSystem/14532928-3bb5-4396-a4a3-aea6aa4fa56c'
};
var sc = new qg.OPMCalc(input);
var q = sc.listOutdated();
console.log(q);
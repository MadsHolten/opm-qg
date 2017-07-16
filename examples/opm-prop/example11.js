"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 11
 * Get a list of assumed properties
 * 
 */
var sc = new qg.OPMProp();
var q = sc.listAssumptions();
console.log(q);
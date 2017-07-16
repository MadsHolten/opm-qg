"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 7
 * Get a list of deleted properties
 * 
 */
var sc = new qg.OPMProp();
var q = sc.listDeleted();
console.log(q);
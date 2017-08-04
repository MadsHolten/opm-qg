"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 8
 * Get latest evaluation of a specific property
 * 
 */
var input = {
    queryType: 'construct',
    latest: true,
    restriction: 'derived'
};
var sc = new qg.OPMProp(input);
var q = sc.getFoIProps();
console.log(q);
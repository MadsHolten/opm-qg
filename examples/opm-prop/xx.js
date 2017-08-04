"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 8
 * Get latest evaluation of a specific property
 * 
 */
var input = {
    queryType: 'select',
    latest: true,
    queryType: 'construct'
};
var sc = new qg.OPMProp(input);
var q = sc.getFoIProps();
console.log(q);
"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 10
 * Restore deleted property
 */
var input = {
    propertyURI: 'https://localhost/opm/Property/bbc02774-a7f0-4011-876a-a879f890404c',
    hostURI: 'https://localhost/opm'
};
var sc = new qg.OPMProp(input);
var q = sc.restoreProp();
console.log(q);
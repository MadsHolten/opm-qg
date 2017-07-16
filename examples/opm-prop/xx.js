"use strict";
var qgen = require("../../dist/index");

// var input = { 
//     resourceURI: 'https://localhost/opm/HeatConsumer/1',
//     language: 'en'
// };

var sc = new qgen.OPMProp();
var q = sc.getResourceProps();
console.log(q);
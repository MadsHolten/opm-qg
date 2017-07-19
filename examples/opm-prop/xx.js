"use strict";
var qgen = require("../../dist/index");

// var input = { 
//     foiURI: 'https://localhost/opm/HeatConsumer/1',
//     language: 'en'
// };
var input = { 
    foiURI: 'https://localhost/opm/HeatConsumer/1',
  language: 'en' }
;
var sp = new qgen.OPMProp(input);
var q = sp.getFoIProps();
console.log(q);
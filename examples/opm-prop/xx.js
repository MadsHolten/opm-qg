"use strict";
var qgen = require("../../dist/index");
/**
 * EXAMPLE 1
 * add property to a specific resource
 */

var input = { 
    resourceURI: 'https://localhost/opm/HeatConsumer/1',
    language: 'en'
};
// var input = {
//     value: {
//         unit: 'Cel',
//         datatype: 'cdt:ucum',
//         property: 'seas:fluidSupplyTemperature',
//         value: '65'
//     },
//     hostURI: 'https://host/proj',
//     prefixes: [
//         {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
//     ],
//     resourceURI: 'https://host/proj/HeatingSystem/2'
// };

var sc = new qgen.OPMProp(input);
var q = sc.getProps();
console.log(q);
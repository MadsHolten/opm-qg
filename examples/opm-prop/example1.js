"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 1
 * add/update property to a specific FoI
 */

var input = {
    foiURI: 'https://localhost/opm/HeatingSystem/908df30e-3678-431a-b60f-8b8bc49d799c',
    inferredProperty: 'https://w3id.org/seas/fluidReturnTemperature',
    value: {
        value: '70 Cel',
        datatype: 'cdt:ucum'
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ],
    reliability: 'assumption'
};

var sc = new qg.OPMProp();
var q = sc.postFoIProp(input);
//var q = sc.putFoIProp();
console.log(q);
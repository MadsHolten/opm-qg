"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 1
 * add property to a specific resource
 */
var input = {
    value: {
        unit: 'Cel',
        datatype: 'cdt:ucum',
        //property: 'seas:fluidSupplyTemperature',
        property: 'https://w3id.org/seas/fluidReturnTemperature',
        value: '70'
    },
    hostURI: 'https://host/proj',
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ],
    resourceURI: 'https://localhost/seas/HeatingSystem/9118fbf2-0299-467e-bd09-dd3e323805a2'
};

var sc = new qg.OPMProp(input);
var q = sc.postProp();
console.log(q);
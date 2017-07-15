"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 3
 * update property for a specific resource
 */
var input = {
    value: {
        unit: 'Cel',
        datatype: 'cdt:ucum',
        property: 'seas:fluidSupplyTemperature',
        value: '70'
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ],
    resourceURI: 'https://localhost/seas/HeatingSystem/14532928-3bb5-4396-a4a3-aea6aa4fa56c'
};
var sc = new qg.OPMProp(input);
var q = sc.putResourceProp();
console.log(q);
"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 1
 * add/update property to a specific resource
 */
var input = {
    value: {
        unit: 'Cel',
        datatype: 'cdt:ucum',
        //property: 'seas:fluidSupplyTemperature',
        property: 'https://w3id.org/seas/fluidReturnTemperature',
        value: '70'
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ],
    resourceURI: 'https://localhost/seas/HeatingSystem/1'
};

var sc = new qg.OPMProp(input);
var q = sc.postResourceProp();
//var q = sc.putResourceProp();
console.log(q);
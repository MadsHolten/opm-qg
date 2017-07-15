"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 3
 * properties of a resource itself
 * 
 * Based on properties that exist on the resource itself
 * 
 * Returns the fluid temperature difference if the specified
 * resource has a fluid supply- and return temperature
 * 
 * The postClac method only returns a result for resources
 * where the calculated property does not already exist
 */
var input = {
    args: [
        { property: 'seas:fluidSupplyTemperature' },
        { property: 'seas:fluidReturnTemperature' }
    ],
    result: {
        unit: 'Cel',
        datatype: 'cdt:ucum',
        property: 'seas:fluidTemperatureDifference',
        calc: 'abs(?arg1-?arg2)'
    },
    resourceURI: 'https://localhost/seas/HeatingSystem/6626b0b1-3578-4f1e-a6ec-91c7c59fb143',
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ]
};
var sc = new qg.OPMCalc(input);
var q = sc.postCalc();
console.log(q);
"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 6
 * properties of the resources themself
 * 
 * Based on properties that exist on the resource itself
 *
 * Returns the fluid temperature difference of anything
 * that has a fluid supply- and return temperature
 * 
 * The putClac method only returns a result for resources
 * where the calculated property already exists
 */
var input = {
    resourceURI: 'https://localhost/seas/HeatingSystem/b5f9e70e-af29-4c28-a2c5-16ff74645a66',
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
    hostURI: 'https://host/proj',
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ]
};
var sc = new qg.OPMCalc(input);
var q = sc.putCalc();
console.log(q);
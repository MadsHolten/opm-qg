"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 1
 * properties of the FoIs themself
 * 
 * Based on properties that exist on the FoI itself
 *
 * Returns the fluid temperature difference of anything
 * that has a fluid supply- and return temperature
 * 
 * The postCalc method only returns a result for FoIs
 * where the calculated property does not already exist
 * 
 * The putCalc method only returns a result for FoIs
 * where the calculated property already exists
 */
var input = {
    args: [
        { property: 'seas:fluidSupplyTemperature' },
        { property: 'seas:fluidReturnTemperature' }
    ],
    result: {
        unit: '°C',
        datatype: 'cdt:temperature',
        property: 'seas:fluidTemperatureDifference',
        calc: 'abs(?arg1-?arg2)'
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ]
};
var sc = new qg.OPMCalc(input);
var q = sc.postCalc();
//var q = sc.putCalc();
console.log(q);
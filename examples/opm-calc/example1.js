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
    calculationURI: 'https://localhost/opm/Calculation/0c69e6a2-5146-45c3-babb-2ecea5f5d2c9',
    expression: 'abs(?ts-?tr)',
    inferredProperty: 'seas:fluidTemperatureDifference',
    argumentPaths: ['?foi seas:fluidSupplyTemperature ?ts', '?foi seas:fluidReturnTemperature ?tr'],
    unit: {
        value: '°C',
        datatype: 'cdt:temperature'
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ]
};
var sc = new qg.OPMCalc();
var q = sc.postCalc(input);
//var q = sc.putCalc();
console.log(q);
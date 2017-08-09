"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE xx
 * retrieving calculation data
 */
var input = {
    label: 'Calculation 1',
    comment: 'A FoI having a seas:fluidSupplyTemperature and a seas:fluidReturnTemperature also has a seas:fluidTemperatureDifference given by the absolute value of the difference between the two.',
    expression: "abs(?ts-?tr)",
    argumentPaths: [ "?origin seas:fluidSupplyTemperature ?ts", "?origin seas:fluidReturnTemperature ?tr" ],
    inferredProperty: {
        propertyURI: "seas:fluidTemperatureDifference",
        unit: {value: "°C", datatype: "cdt:temperature"}
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ],
    hostURI: "https://localhost/opm"
};
var sc = new qg.OPMCalc;
var q = sc.postCalcData(input);
console.log(q);
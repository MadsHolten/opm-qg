"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 4
 * storing calculation data
 */
var input = {
    args: [
        { property: 'seas:fluidSupplyTemperature' },
        { property: 'seas:fluidReturnTemperature' }
    ],
    comment: 'Just a comment',
    userURI: 'https://www.niras.dk/employees/mhra',
    result: {
        unit: '°C',
        datatype: 'cdt:temperature',
        property: 'seas:fluidTemperatureDifference',
        calc: 'abs(?arg1-?arg2)'
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ],
    hostURI: "https://localhost/opm"
};
var sc = new qg.OPMCalc(input);
var q = sc.postCalcData();
console.log(q);
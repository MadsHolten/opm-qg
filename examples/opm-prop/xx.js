"use strict";
var qgen = require("../../dist/index");

// var input = { 
//     foiURI: 'https://localhost/opm/HeatConsumer/1',
//     language: 'en'
// };
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
var sp = new qgen.OPMCalc(input);
var q = sp.postCalcData();
console.log(q);
"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 2
 * argument paths for multiple FoIs
 * 
 * Based on properties that exist on another FoI that
 * has a connection to the FoI itself
 * 
 * An argument path for the argument is specified. It is
 * given by a triple pattern, and it must start with the
 * FoI itself using the "?foi" variable.
 * The name of the argument (target) variable can be anything, but
 * the following variables are reserved, and cannot be used:
 * ?propertyURI, ?evaluationURI, ?_res, ?res, ?now, ?eval:n,
 * ?t_:n, ?t:n, ?g, ?gi, ?t_c, ?tc, ?_v:n, ?arg:n, ?guid
 * where :n is the number of the argument.
 * 
 * The variable name of the argument is the one used in the expression
 * 
 * In the example, we are looking for a property that exists
 * on the super system of the flow system itself. 
 *
 * Returns the fluid temperature difference of anything
 * that is a sub flow system of a system with a fluid supply- 
 * and return temperature
 */
var input = {
    calculationURI: 'https://localhost/opm/Calculation/0c69e6a2-5146-45c3-babb-2ecea5f5d2c9',
    expression: 'abs(?ts-?tr)',
    inferredProperty: 'seas:fluidTemperatureDifference',
    argumentPaths: ['?foi seas:subFlowSystemOf/seas:fluidSupplyTemperature ?ts', '?foi seas:subFlowSystemOf/seas:fluidReturnTemperature ?tr'],
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

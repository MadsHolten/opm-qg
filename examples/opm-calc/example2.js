"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 2
 * target paths for multiple resources
 * 
 * Based on properties that exist on another resource that
 * has a connection to the resource itself
 * 
 * A target path for the argument is specified. It is
 * given by a triple pattern, and it must start with the
 * resource itself using the "?resource" variable.
 * The name of the target variable can be anything, but
 * the following variables are reserved, and cannot be used:
 * ?propertyURI, ?evaluationURI, ?_res, ?res, ?now, ?eval:n,
 * ?t_:n, ?t:n, ?g, ?gi, ?t_c, ?tc, ?_v:n, ?arg:n, ?guid
 * where :n is the number of the argument.
 * 
 * In the example, we are looking for a property that exists
 * on the super system of the flow system itself. 
 *
 * Returns the fluid temperature difference of anything
 * that is a sub flow system of a system with a fluid supply- 
 * and return temperature
 */
var input = {
    args: [
        { property: 'seas:fluidSupplyTemperature',
          targetPath: '?resource seas:subFlowSystemOf ?target' },
        { property: 'seas:fluidReturnTemperature',
          targetPath: '?resource seas:subFlowSystemOf ?target' }
    ],
    result: {
        unit: 'Cel',
        datatype: 'cdt:ucum',
        property: 'seas:fluidTemperatureDifference',
        calc: 'abs(?arg1-?arg2)'
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ]
};
var sc = new qg.OPMCalc(input);
var q = sc.postCalc();
console.log(q);

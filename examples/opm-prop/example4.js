"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 4
 * Get latest evaluation of a single property of
 * a specific FoI
 * 
 */
var input = {
    foiURI: "https://localhost/opm/HeatConsumer/1",
    //propertyURI: "seas:fluidTemperatureDifference",
    propertyURI: "https://w3id.org/seas/heatOutput",
    latest: true
};
var sc = new qg.OPMProp(input);
var q = sc.getFoIProp();
console.log(q);
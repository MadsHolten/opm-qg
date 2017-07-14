"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 6
 * Get latest evaluation of a single property of
 * a specific resource
 * 
 */
var input = {
    resourceURI: "https://localhost/seas/HeatingSystem/b5f9e70e-af29-4c28-a2c5-16ff74645a66",
    //propertyURI: "seas:fluidTemperatureDifference",
    propertyURI: "https://w3id.org/seas/fluidReturnTemperature",
    latest: false
};
var sc = new qg.OPMProp(input);
var q = sc.getProp();
console.log(q);
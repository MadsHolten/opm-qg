"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE 9
 * Get a list of subscribers of a property 
 * (a derived property that takes the property as an argument)
 */
var input = {
    propertyURI: 'https://localhost/opm/Property/6daf0c7a-f1cb-4a14-ac53-4156c2fe4cc1'
};
var sc = new qg.OPMProp(input);
var q = sc.listSubscribers();
console.log(q);
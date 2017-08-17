"use strict";
var qg = require("../../dist/index");
/**
 * EXAMPLE xx
 * retrieving calculation data
 */
var input = {
    calculationURI: "https://localhost/opm/Calculation/0c69e6a2-5146-45c3-babb-2ecea5f5d2c9",
    expression: "abs(?ts-?tr)",
    inferredProperty: "https://w3id.org/seas/fluidTemperatureDifference",
    argumentPaths: [
        "?foi seas:fluidSupplyTemperature ?ts .",
        "?foi seas:fluidReturnTemperature ?tr"
    ],
    unit: {
        value: "\\u00B0C",
        datatype: "cdt:temperature"
    },
    prefixes: [
        {
            "prefix": "rdfs",
            "uri": "http://www.w3.org/2000/01/rdf-schema#"
        },
        {
            "prefix": "xsd",
            "uri": "http://www.w3.org/2001/XMLSchema#"
        },
        {
            "prefix": "prov",
            "uri": "http://www.w3.org/ns/prov#"
        },
        {
            "prefix": "sd",
            "uri": "http://www.w3.org/ns/sparql-service-description#"
        },
        {
            "prefix": "opm",
            "uri": "https://w3id.org/opm#"
        },
        {
            "prefix": "cdt",
            "uri": "http://w3id.org/lindt/custom_datatypes#"
        }
    ]
};
var sc = new qg.OPMCalc;
var q = sc.putCalc(input);
console.log(q);
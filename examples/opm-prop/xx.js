"use strict";
var qg = require("../../dist/index");


var host = 'https://example.org/';

var mainGraph = true;

var prefixes = [
    {prefix: 'ex', uri: 'https://example.org/'},
    {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'},
    {prefix: 'props', uri: 'https://w3id.org/product/props/'}
];

var qGen = new qg.OPMProp(host, prefixes, mainGraph);

var input = {
    foiURI: 'ex:FoI',
    inferredProperty: 'props:designAmbientTemperature',
    value: '"65 Cel"^^cdt:temperature',
    reliability: 'assumed'
};

var q = qGen.deleteProp(input);
console.log(q);
const { Connection, query, db } = require('stardog');
const { OPMProp, OPMCalc } = require('../dist/index');

/**
 * CONFIG
 */
var conn = new Connection({
    username: 'admin',
    password: 'admin',
    endpoint: 'http://localhost:5820',
});
var dbName = 'qg-test';

async function main() {

    var host = 'https://example.org/opmTest/';

    var mainGraph = true;

    var prefixes = [
        {prefix: 'ex', uri: 'https://example.org/'},
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'},
        {prefix: 'props', uri: 'https://w3id.org/product/props/'}
    ]

    let opmCalc = new OPMCalc(host, prefixes, mainGraph);
    let opmProp = new OPMProp(host, prefixes);

    // var input = {
    //     foiURI: 'inst:xx',
    //     property: 'props:area',
    //     value: '"20 m2"^^cdt:area'
    // }

    // var input = {
    //     type: "sum",
    //     inferredProperty: "props:totalArea",
    //     label: "total area of sorrounding spaces",
    //     argumentPaths: ["?foi ^bot:interfaceOf ?int . ?int props:area ?a"],
    //     expression: "xsd:string(?res)"
    // }

    var input = {
        propertyURI: "https://prop",
        value: "test",
        queryType: 'insert'
    }
  
    var q = opmProp.putProp(input);

    console.log(q);

    // try{
    //     var q = opmCalc.getCalcDataByLabel('temp product');
    //     console.log(q);
    // }catch(err){
    //     console.log(err);
    // }

    
}

main();
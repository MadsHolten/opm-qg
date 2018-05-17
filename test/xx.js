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

    var host = 'https://example.org/';

    var mainGraph = true;

    var prefixes = [
        {prefix: 'ex', uri: 'https://example.org/'},
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'},
        {prefix: 'props', uri: 'https://w3id.org/product/props/'}
    ]

    let opmCalc = new OPMCalc(host, prefixes, mainGraph);

    // try{
    //     var q = opmCalc.getCalcDataByLabel('temp product');
    //     console.log(q);
    // }catch(err){
    //     console.log(err);
    // }

    
}

main();
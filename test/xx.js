const { Connection, query, db } = require('stardog');
const qg = require("../dist/index");

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

    var qGen = new qg.OPMProp(host, prefixes, mainGraph);

    var input = {
        foiURI: 'ex:FoI',
        inferredProperty: 'props:designAmbientTemperature',
        value: '"70 Cel"^^cdt:temperature',
        reliability: 'assumed'
    };
    
    // var q = qGen.postFoIProp(input);

    // const res = await query.execute(conn, dbName, q, 'application/ld+json');
    
    // console.log(q);
    // console.log(res);

    // try {
    //     const res = await query.execute(conn, dbName, q, 'application/ld+json');
    //     console.log(res);
    // }
    // catch(err) {
    //     console.log(err.message);
    // }

    
}

main();
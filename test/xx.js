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

    // Get property URI for ex:FoI
    var q = `
    PREFIX ex: <https://example.org/>
    PREFIX props: <https://w3id.org/product/props/>

    SELECT ?uri
    WHERE {
        ex:FoI props:designAmbientTemperature ?uri .
    }`;

    const res1 = await query.execute(conn, dbName, q);

    // Save to global variable
    var propURI = res1.body.results.bindings[0].uri.value;

    var input = {
        propertyURI: propURI,
        reliability: 'derived'
    };
    
    var q = qGen.setReliability(input);

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
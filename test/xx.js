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

    var mainGraph = false;

    var prefixes = [
        {prefix: 'ex', uri: 'https://example.org/'},
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'},
        {prefix: 'props', uri: 'https://w3id.org/props#'}
    ]

    let opmCalc = new OPMCalc(host, prefixes, mainGraph);
    let opmProp = new OPMProp(host, prefixes);

    var input = {
        label:            'transmission heat loss for space',
        calculationURI:   'https://host/db/HVAC/c2',
        argumentPaths:    ['?foi ^ice:surfaceInterior ?i . ?i props:totalHeatTransferRate ?htr'],
        inferredProperty: 'props:transmissionHeatTransferRate',
        pathRestriction:  '?foi a ice:ThermalEnvironment',
        expression:       'sum(?htr)'
    }

    // var input = {
    //     type: "sum",
    //     inferredProperty: "props:totalArea",
    //     label: "total area of sorrounding spaces",
    //     argumentPaths: ["?foi ^bot:interfaceOf ?int . ?int props:area ?a"],
    //     expression: "xsd:string(?res)"
    // }

    // input = {
    //     graphURI: "http://web-bim/",
    //     calculationURI: "http://web-bim/",
    //     label: '"Total heat loss for space"@en',
    //     argumentPaths: ['?foi props:transmissionHeatTransferRate ?tr', '?foi props:infiltrationHeatTransferRate ?inf'],
    //     comment: 'Returns the sum of the infiltration heat loss and the transmission heat loss for each space.',
    //     userURI: 'https://www.niras.dk/employees/mhra',
    //     expression: "concat(xsd:string(xsd:decimal(strbefore(str(?tr), ' '))+xsd:decimal(strbefore(str(?inf), ' '))), ' W')",
    //     inferredProperty: 'props:heatingDemand',
    //     queryType: 'insert'
    // };

    var q = opmCalc.postCalc(input);

    // console.log(q);

    // try{
    //     var q = opmCalc.getCalcDataByLabel('temp product');
    //     console.log(q);
    // }catch(err){
    //     console.log(err);
    // }

    
}

main();
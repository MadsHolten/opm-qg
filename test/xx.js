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

    input = {
        graphURI: "https://web-bim/projects/1001/HVAC/",
        calculationURI: "http://web-bim/projects/1001/calculation_f94fc9f8-36b3-4661-a5ef-bacbe7aac047",
        label: '"Transmission heat loss for space"@en',
        argumentPaths: ['?foi a ice:ThermalEnvironment ; ^ice:surfaceInterior ?i . ?i props:totalHeatTransferRate ?htr'],
        comment: 'Sums the transmission heat loss through all the parts of the building envelope which face the space.',
        userURI: 'https://www.niras.dk/employees/mhra',
        expression: "sum(?htr)+20",
        inferredProperty: 'props:transmissionHeatTransferRate',
        queryType: 'construct'
    };
  
    var q = opmCalc.putCalc(input);

    // console.log(q);

    // try{
    //     var q = opmCalc.getCalcDataByLabel('temp product');
    //     console.log(q);
    // }catch(err){
    //     console.log(err);
    // }

    
}

main();
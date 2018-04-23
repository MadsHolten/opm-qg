const expect = require('chai').expect;
const _ = require('lodash');
const jsonld = require('jsonld');
const { Connection, query, db } = require('stardog');
const { OPMProp, OPMCalc } = require('../dist/index');
const config = require('./config.json');

/**
 * CONFIG DB CONNECTION
 */
var conn = new Connection({
    username: config.username,
    password: config.password,
    endpoint: config.endpoint,
});
var dbName = config.database;

// Global variables
var calcURI;

describe("Test Stardog connection", () => {

    //Wipe database if exists
    it('Wipe database', async () => {

        const res = await db.drop(conn, dbName);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });
    
    //Create database
    it('Create database', async () => {

        const res = await db.create(conn, dbName);

        expect(res).to.have.property('status').that.is.equals(201);     // Should return status 201

    });

});

/**
 * Create 3 FoIs each having a props:supplyWaterTemperatureHeating (70 Cel) and 
 * props:returnWaterTemperatureHeating (40 Cel)
 */
describe("Prepare 3 Features of Interest each with a supply- and return water temperature for heating - main graph", () => {
    
        var host = 'https://example.org/';
    
        var mainGraph = true;
        
        var prefixes = [
            {prefix: 'ex', uri: 'https://example.org/'},
            {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'},
            {prefix: 'props', uri: 'https://w3id.org/product/props/'}
        ];
    
        let opmProp = new OPMProp(host, prefixes, mainGraph);
        
        // Insert FoIs
        it('Insert four FoIs (ex:FoI1, ex:FoI2, ex:FoI3, ex:FoI4)', async () => {
            var q = `
            PREFIX bot: <https://w3id.org/bot#>
            PREFIX ex: <https://example.org/>
            INSERT DATA {
                ex:FoI1 a bot:Element .
                ex:FoI2 a bot:Element .
                ex:FoI3 a bot:Element .
                ex:FoI4 a bot:Space .
            }`;
    
            const res = await query.execute(conn, dbName, q);
    
            expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
    
        });

        it('Check that FoIs were correctly inserted', async () => {
            var q = `
            PREFIX bot: <https://w3id.org/bot#>
            PREFIX ex: <https://example.org/>
            SELECT (COUNT(?foi) AS ?count) {
                ?foi ?p ?o
            }`;
            
            const res = await query.execute(conn, dbName, q);
    
            expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
            expect(res.body.results.bindings[0].count.value).to.equal('4'); // Should have count = 4
    
        });

        it('Assign a property (props:supplyWaterTemperatureHeating) to all FoIs (INSERT)', async () => {
            
            var q = opmProp.postByPath('?foi a ?class FILTER(?class = bot:Element || ?class = bot:Space)', 'props:supplyWaterTemperatureHeating', '"70"^^xsd:decimal', 'assumed');
    
            const res = await query.execute(conn, dbName, q);
    
            expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
    
        });

        it('Check that the properties were correctly inserted', async () => {
            
            var q = opmProp.getPropsByType('props:supplyWaterTemperatureHeating');
    
            const res = await query.execute(conn, dbName, q, 'application/ld+json');
    
            expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
            expect(res).to.have.property('body').to.be.an('array').to.have.length(12);   // Should return a body with length 12 (4foiURI+4propURI+4stateURI)
    
        });

        it('Assign a property (props:returnWaterTemperatureHeating) to all FoIs (INSERT)', async () => {
            
            var q = opmProp.postByPath('?foi a ?class FILTER(?class = bot:Element || ?class = bot:Space)', 'props:returnWaterTemperatureHeating', '"40"^^xsd:decimal');
    
            const res = await query.execute(conn, dbName, q);
    
            expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
    
        });

        it('Check that the properties were correctly inserted', async () => {
            
            var q = opmProp.getPropsByType('props:returnWaterTemperatureHeating');
    
            const res = await query.execute(conn, dbName, q, 'application/ld+json');
    
            expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
            expect(res).to.have.property('body').to.be.an('array').to.have.length(12);   // Should return a body with length 12 (4foiURI+4propURI+4stateURI)
    
        });
    
});

describe("Infer derived properties - main graph", () => {

    var host = 'https://example.org/';
    
    var mainGraph = true;
    
    var prefixes = [
        {prefix: 'ex', uri: 'https://example.org/'},
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'},
        {prefix: 'props', uri: 'https://w3id.org/product/props/'}
    ];

    let opmCalc = new OPMCalc(host, prefixes, mainGraph);
    let opmProp = new OPMProp(host, prefixes, mainGraph);

    it('Try appending a calculation where the number of arguments does not match with the number of argument paths given (CONSTRUCT)', async () => {
        
        var input = {
            foiURI: 'ex:FoI1',
            expression: 'abs(?ts-?tr+?x)',
            inferredProperty: 'props:heatingTemperatureDelta',
            argumentPaths: ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr']
        };

        var q = opmCalc.postCalc(input);

        expect(q).to.be.a('error');

    });

    /**
     * Append derived property to a specific FoI by providing an expression and paths to the arguments of the expression
     */
    it('Append calculation to ex:FoI1 (CONSTRUCT)', async () => {
        
        var input = {
            foiURI: 'ex:FoI1',
            expression: 'abs(?ts-?tr)',
            inferredProperty: 'props:heatingTemperatureDelta',
            argumentPaths: ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr']
        };

        var q = opmCalc.postCalc(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(3);   // Should return a body with length 3 (foiURI+propURI+stateURI)
        expect(res.body[2]['@type']).to.be.an('array').to.have.length(3);           // Property state should have 3 classes (opm:CurrentState+opm:Derived+opm:Assumed)

    });

    it('Append calculation to ex:FoI1 (INSERT)', async () => {
        
        var foiURI = 'ex:FoI1';
        var expression = 'abs(?ts-?tr)';
        var inferredProperty = 'props:heatingTemperatureDelta';
        var argumentPaths = ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr'];

        var q = opmCalc.postByFoI(foiURI, inferredProperty, expression, argumentPaths);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200

    });

    it('Check that the derived property was correctly inserted', async () => {

        var q = opmProp.getFoIProps('ex:FoI1');

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                                             // Should return status 200
        expect(res.body[0]).to.have.deep.any.key('https://w3id.org/product/props/heatingTemperatureDelta');     // should have the new property assigned

    });

    /**
     * It should not be possible to append the property if it is already defined
     */
    it('Re-append calculation to ex:FoI1 (CONSTRUCT)', async () => {
        
        var input = {
            foiURI: 'ex:FoI1',
            expression: 'abs(?ts-?tr)',
            inferredProperty: 'props:heatingTemperatureDelta',
            argumentPaths: ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr']
        };

        var q = opmCalc.postCalc(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200
        expect(res).to.have.property('body').to.be.empty;           // Should not return any results

    });

    /**
     * Appending the property by path should assign it to all instances of bot:Element but not to ex:FoI4 which is a bot:Space
     * The query should append the property to ex:FoI2 and ex:FoI3
     */
    it('Post derived property props:heatingTemperatureDelta by path (?foi a bot:Element) (CONSTRUCT)', async () => {

        var input = {
            path: '?foi a bot:Element',
            calculationURI: 'https://localhost/opm/Calculation/0c69e6a2-5146-45c3-babb-2ecea5f5d2c9',
            expression: 'abs(?ts-?tr)',
            inferredProperty: 'props:heatingTemperatureDelta',
            argumentPaths: ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr']
        };

        var q = opmCalc.postCalc(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(6);   // Should return a body with length 6 (2foiURI+2propURI+2stateURI)
        expect(res.body[5]['@type']).to.be.an('array').to.have.length(3);           // Property state should have 3 classes (opm:CurrentState+opm:Derived+opm:Assumed)

    });

    it('Post derived property props:heatingTemperatureDelta by path (?foi a bot:Element) (INSERT)', async () => {
        
        var path = '?foi a bot:Element';
        var calculationURI = 'https://localhost/opm/Calculation/0c69e6a2-5146-45c3-babb-2ecea5f5d2c9';
        var expression ='abs(?ts-?tr)';
        var inferredProperty = 'props:heatingTemperatureDelta';
        var argumentPaths = ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr'];

        var q = opmCalc.postByPath(path, inferredProperty, expression, argumentPaths, calculationURI);

        const res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200

    });

    /**
     * Appending the property globally should also append it to the bot:Space instance
     */
    it('Post derived property globally (CONSTRUCT)', async () => {
        
        var input = {
            calculationURI: 'https://localhost/opm/Calculation/0c69e6a2-5146-45c3-babb-2ecea5f5d2c9',
            expression: 'abs(?ts-?tr)',
            inferredProperty: 'props:heatingTemperatureDelta',
            argumentPaths: ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr']
        };

        var q = opmCalc.postCalc(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(3);   // Should return a body with length 3 (foiURI+propURI+stateURI)
        expect(res.body[2]['@type']).to.be.an('array').to.have.length(3);           // Property state should have 3 classes (opm:CurrentState+opm:Derived+opm:Assumed)

    });

    

});

describe("Make changes to arguments - main graph", () => {
    
    var host = 'https://example.org/';
    
    var mainGraph = true;
    
    var prefixes = [
        {prefix: 'ex', uri: 'https://example.org/'},
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'},
        {prefix: 'props', uri: 'https://w3id.org/product/props/'}
    ];

    let opmCalc = new OPMCalc(host, prefixes, mainGraph);
    let opmProp = new OPMProp(host, prefixes, mainGraph);

    /**
     * There should not be any outdated properties at this point
     */
    it('List outdated properties (CONSTRUCT)', async () => {

        var q = opmCalc.listAllOutdated();

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200
        expect(res).to.have.property('body').to.be.empty;           // Should not return any results

    });

    it('Update property (props:supplyWaterTemperatureHeating) for all bot:Element instances', async () => {
        
        var q = opmProp.putByPath('?foi a bot:Element', 'props:supplyWaterTemperatureHeating', '"65"^^xsd:decimal', 'assumed');

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    /**
     * There should not be any outdated properties at this point
     */
    it('Confirm that it affects the list of outdated properties', async () => {
        
        var q = opmCalc.listAllOutdated();

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(9);   // Should return a body with length 9 (3foiURI+3propURI+3stateURI)

    });

    it('List outdated properties for ex:FoI1', async () => {
        
        var q = opmCalc.listOutdatedByFoI('ex:FoI1');

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(3);   // Should return a body with length 3 (foiURI+propURI+stateURI)

    });


    /**
     * SHOULD BEGIN WITH THESE STEPS!
     */


    /**
     * Add new calculation
     */
    it('Add new calculation (CONSTRUCT)', async () => {

        var input = {
            label: '"Heating temperature difference"@en',
            argumentPaths: ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr'],
            comment: 'Just a comment',
            userURI: 'https://www.niras.dk/employees/mhra',
            expression: 'abs(?ts-?tr)',
            inferredProperty: 'props:heatingTemperatureDelta'
        };

        var q = opmCalc.postCalcData(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(1);   // Should return a body with length 1 (calculationURI)

    });

    it('Add new calculation (INSERT)', async () => {
        
        var input = {
            label: '"Heating temperature difference"@en',
            argumentPaths: ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr'],
            comment: 'Just a comment',
            userURI: 'https://www.niras.dk/employees/mhra',
            expression: 'abs(?ts-?tr)',
            inferredProperty: 'props:heatingTemperatureDelta',
            queryType: 'insert'
        };

        var q = opmCalc.postCalcData(input);

        const res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    /**
     * When querying for calculations, we should now receive 1 result
     */
    it('Check that it was correctly inserted', async () => {

        var q = opmCalc.listCalculations();

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        // Save URI of the calculation in global variable
        this.calcURI = res.body[0]['@id'];

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(1);   // Should return a body with length 1 (calculationURI)

    });

    /**
     * This is a demponstration of the steps that should be performed by the server when receiving a PUT request to the calculation URI
     * 1) Get calculation data
     * 2) Do an update query
     */
    it('get calculation data', async () => {
        
        // STEP 1
        // Get calculation data

        var q = opmCalc.getCalcData({calculationURI: this.calcURI});

        const res1 = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res1).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res1).to.have.property('body').to.be.an('array').to.have.length(1);   // Should return a body with length 1 (calculationURI)

        var context = opmCalc.getJSONLDContext()                // Get JSON-LD formatted context file with known prefixes
        var data = await jsonld.compact(res1.body, context);    // Shorten URIs with prefixes ()

        // STEP 2
        // Update all derived properties that are outdated (argument(s) have changed)

        var calculationURI = this.calcURI;
        var expression = data['opm:expression'];
        var inferredProperty = data['opm:inferredProperty']['@id'];
        var argumentPaths = data['opm:argumentPaths']['@list'];

        var q = opmCalc.putGlobally(inferredProperty, expression, argumentPaths, calculationURI);

        console.log(q);

        const res2 = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res2).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    /**
     * Make sure that no calculations are now outdated
     */
    it('Confirm that there are no longer any outdated calculations', async () => {
        
        var q = opmCalc.listAllOutdated();

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        // console.log(res);

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200
        expect(res).to.have.property('body').to.be.empty;   // Should return a body with length 9 (3foiURI+3propURI+3stateURI)

    });

});
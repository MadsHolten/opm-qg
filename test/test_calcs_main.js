const expect = require('chai').expect;
const { Connection, query, db } = require('stardog');
const qg = require('../dist/index');
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
var propURI;

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
    
        var qGen = new qg.OPMProp(host, prefixes, mainGraph);
        
        // Insert FoIs
        it('Insert three FoIs (ex:FoI1, ex:FoI2, ex:FoI3)', async () => {
            var q = `
            PREFIX bot: <https://w3id.org/bot#>
            PREFIX ex: <https://example.org/>
            INSERT DATA {
                ex:FoI1 a bot:Element .
                ex:FoI2 a bot:Element .
                ex:FoI3 a bot:Element .
            }`;
    
            const res = await query.execute(conn, dbName, q);
    
            expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
    
        });

        it('Check that FoIs were correctly inserted', async () => {
            var q = `
            PREFIX bot: <https://w3id.org/bot#>
            PREFIX ex: <https://example.org/>
            SELECT (COUNT(?foi) AS ?count) {
                ?foi a bot:Element .
            }`;
            
            const res = await query.execute(conn, dbName, q);
    
            expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
            expect(res.body.results.bindings[0].count.value).to.equal('3'); // Should have count = 3
    
        });

        it('Assign a property (props:supplyWaterTemperatureHeating) to all FoIs by path (?x a bot:Element) (INSERT)', async () => {
            
            var q = qGen.postByPath('?x a bot:Element', 'props:supplyWaterTemperatureHeating', '"70 Cel"^^cdt:temperature');
    
            const res = await query.execute(conn, dbName, q);
    
            expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
    
        });

        it('Check that the properties were correctly inserted', async () => {
            
            var q = qGen.getPropsByType('props:supplyWaterTemperatureHeating');
    
            const res = await query.execute(conn, dbName, q, 'application/ld+json');
    
            expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
            expect(res).to.have.property('body').to.be.an('array').to.have.length(9);   // Should return a body with length 9 (3foiURI+3propURI+3stateURI)
    
        });

        it('Assign a property (props:returnWaterTemperatureHeating) to all FoIs by path (?x a bot:Element) (INSERT)', async () => {
            
            var q = qGen.postByPath('?x a bot:Element', 'props:returnWaterTemperatureHeating', '"40 Cel"^^cdt:temperature');
    
            const res = await query.execute(conn, dbName, q);
    
            expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
    
        });

        it('Check that the properties were correctly inserted', async () => {
            
            var q = qGen.getPropsByType('props:returnWaterTemperatureHeating');
    
            const res = await query.execute(conn, dbName, q, 'application/ld+json');
    
            expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
            expect(res).to.have.property('body').to.be.an('array').to.have.length(9);   // Should return a body with length 9 (3foiURI+3propURI+3stateURI)
    
        });
    
});

describe("Prepare 3 Features of Interest each with a supply- and return water temperature for heating - main graph", () => {

});
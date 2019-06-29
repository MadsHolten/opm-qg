const expect = require('chai').expect;
const { Connection, query, db } = require('stardog');
const { OPMProp } = require('../dist/index');
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

/**
 * GLOBAL SETTINGS
 */
var host = 'https://example.org/';
var iGraph = 'https://example.org/I/';
var mainGraph = false;
var propURI;

var prefixes = [
    {prefix: 'ex', uri: 'https://example.org/'},
    {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'},
    {prefix: 'props', uri: 'https://w3id.org/props#'}
];

let opmProp = new OPMProp(host, prefixes, mainGraph, iGraph, [host, iGraph]);

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

describe("Test property insert - named graph", () => {
    
    //Insert FoI
    it('Insert FoI (ex:FoI)', async () => {
        var q = `
        PREFIX bot: <https://w3id.org/bot#>
        PREFIX ex: <https://example.org/>
        INSERT DATA {
            GRAPH <${iGraph}> {
                ex:FoI a bot:Element
            }
        }`;

        const res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    it('Check that FoI was correctly inserted', async () => {
        var q = `
        PREFIX bot: <https://w3id.org/bot#>
        PREFIX ex: <https://example.org/>
        SELECT (COUNT(?foi) AS ?count) {
            GRAPH ?g {
                ?foi a bot:Element .
            }
        }`;
        
        const res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res.body.results.bindings[0].count.value).to.equal('1'); // Should have count = 1

    });

    it('Add property to ex:FoI (props:designAmbientTemperature "70 Cel"^^cdt:temperature) (CONSTRUCT)', async () => {

        var input = {
            foiURI: 'ex:FoI',
            property: 'props:designAmbientTemperature',
            value: '"70 Cel"^^cdt:temperature',
            reliability: 'assumed'
        };

        var q = opmProp.postProp(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(3);   // Should return a body with length 3 (foiURI+propURI+stateURI)

    });

    it('Add property to FoI (INSERT)', async () => {

        var q = opmProp.postByFoI('ex:FoI', 'props:designAmbientTemperature', '"70 Cel"^^cdt:temperature', 'assumed');

        const res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    it('Get property URI for ex:FoI', async () => {
    
        // Get property URI for ex:FoI
        var q = `
        PREFIX ex: <https://example.org/>
        PREFIX props: <https://w3id.org/props#>
    
        SELECT ?uri
        WHERE {
            GRAPH <${iGraph}> {
                ex:FoI props:designAmbientTemperature ?uri .
            }
        }`;
    
        const res = await query.execute(conn, dbName, q);

        // Save to global variable
        propURI = res.body.results.bindings[0].uri.value;

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res.body.results.bindings[0].uri).to.be.an('object').that.is.not.empty;  // Should return a result

    });

    it('Try adding the same property again (CONSTRUCT)', async () => {
        
        var input = {
            foiURI: 'ex:FoI',
            property: 'props:designAmbientTemperature',
            value: '"70 Cel"^^cdt:temperature',
            reliability: 'assumed'
        };
        
        var q = opmProp.postProp(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res.body).to.be.an('array').that.is.empty;               // Should not return any results

    });

    it('Get all properties of the FoI', async () => {
        
        var q = opmProp.getFoIProps('ex:FoI');

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(3);   // Should return a body with length 3 (foiURI+propURI+stateURI)

    });

    // Insert FoI
    it('Insert two more FoIs (ex:FoI2, ex:FoI3)', async () => {
        var q = `
        PREFIX bot: <https://w3id.org/bot#>
        PREFIX ex: <https://example.org/>
        INSERT DATA {
            GRAPH <${iGraph}> {
                ex:FoI2 a bot:Element .
                ex:FoI3 a bot:Space .
            }
        }`;

        const res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    /**
     * This test should assign the property to ex:FoI2 as it is also of type bot:Element
     * ex:FoI already has the property assigned, so it should not be re-assigned
     */
    it('Assign a property (props:designAmbientTemperature) to all FoIs by path (?x a bot:Element) (CONSTRUCT)', async () => {

        var input = {
            path: '?x a bot:Element',
            property: 'props:designAmbientTemperature',
            value: '"70 Cel"^^cdt:temperature',
            reliability: 'assumed'
        };
        
        var q = opmProp.postProp(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(3);   // Should return a body with length 3 (foiURI+propURI+stateURI)

    });

    it('Assign a property to all FoIs by a path (INSERT)', async () => {
        
        var q = opmProp.postByPath('?x a bot:Element', 'props:designAmbientTemperature', '"70 Cel"^^cdt:temperature', 'assumed');

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200

    });

    /**
     * Get all properties of type 'props:designAmbientTemperature'
     * Should return results from ex:FoI and ex:FoI2
     */
    it('Get all FoIs having a specific property (props:designAmbientTemperature) and the latest state of these properties', async () => {

        var q = opmProp.getPropsByType('props:designAmbientTemperature');

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(6);   // Should return a body with length 6 (2foiURI+2propURI+2stateURI)

    });

});

describe("Test property update - main graph", () => {

    /**
     * It should not be possible to update a property with the same value as the previous
     */
    it('Try updating the property with the same value ("70 Cel"^^cdt:temperature) (CONSTRUCT)', async () => {
        
        var input = {
            foiURI: 'ex:FoI',
            property: 'props:designAmbientTemperature',
            value: '"70 Cel"^^cdt:temperature'
        };
        
        var q = opmProp.putProp(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res.body).to.be.an('array').that.is.empty;               // Should not return any results

    });

    /**
     * A property that doesn't exist should not be created nor updated
     */
    it('Try updating a property that doesn´t exist (props:supplyAirTemperatureCooling) (CONSTRUCT)', async () => {
        
        var input = {
            foiURI: 'ex:FoI',
            property: 'props:supplyAirTemperatureCooling',
            value: '"16 Cel"^^cdt:temperature'
        };
        
        var q = opmProp.putProp(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res.body).to.be.an('array').that.is.empty;               // Should not return any results

    });
    
    /**
     * The value of the property is different from the previous, so it should update
     */
    it('Update the property (props:designAmbientTemperature "65 Cel"^^cdt:temperature) (CONSTRUCT)', async () => {
        
        var input = {
            foiURI: 'ex:FoI',
            property: 'props:designAmbientTemperature',
            value: '"65 Cel"^^cdt:temperature',
            reliability: 'assumed'
        };
        
        var q = opmProp.putProp(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(2);   // Should return a body with length 2 (propURI+stateURI)

    });

    it('Update the property (INSERT)', async () => {
        
        var q = opmProp.putByFoI('ex:FoI', 'props:designAmbientTemperature', '"65 Cel"^^cdt:temperature', 'assumed');

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    /**
     * The property should now hold 2 states:
     * 1) Initial state from when it was created
     * 2) State from when it was updated
     */
    it('Check that property now has 2 states', async () => {
        
        var q = `
        PREFIX  opm: <https://w3id.org/opm#>
        PREFIX ex: <https://example.org/>
        PREFIX props: <https://w3id.org/props#>

        SELECT (COUNT(?state) AS ?count)
        WHERE {
            GRAPH ?g {
                ex:FoI props:designAmbientTemperature/opm:hasPropertyState ?state .
            }
        }`;

        const res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res.body.results.bindings[0].count.value).to.equal('2'); // Should have count = 2

    });

});

describe("Test property delete/restore - main graph", () => {

    it('Delete the property (CONSTRUCT)', async () => {

        var input = {
            propertyURI: propURI,
            reliability: 'deleted'
        };
        
        var q = opmProp.setReliability(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(2);   // Should return a body with length 2 (propURI+stateURI)

    });

    it('Delete the property (INSERT)', async () => {
        
        var q = opmProp.deleteProperty(propURI);

        const res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    /**
     * The property should now hold 3 states:
     * 1) Initial state from when it was created
     * 2) State from when it was updated
     * 3) State from when it was deleted
     */
    it('Validate property history', async () => {
        
        var q = opmProp.getPropertyHistory(propURI);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(5);   // Should return a body with length 5 (foiURI+propURI+3stateURI)

    });

    /**
     * It should not be possible to update a property which latest state is a opm:Deleted
     */
    it('Try updating the deleted property by foiURI/property (CONSTRUCT)', async () => {
        
        var input = {
            foiURI: 'ex:FoI',
            property: 'props:designAmbientTemperature',
            value: '"70 Cel"^^cdt:temperature',
            reliability: 'assumed'
        };
        
        var q = opmProp.putProp(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res.body).to.be.an('array').that.is.empty;               // Should not return any results

    });

    it('Try updating the deleted property by propertyURI (CONSTRUCT)', async () => {
        
        var input = {
            propertyURI: propURI,
            value: '"70 Cel"^^cdt:temperature',
            reliability: 'assumed'
        };
        
        var q = opmProp.putProp(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res.body).to.be.an('array').that.is.empty;               // Should not return any results

    });

    it('Restore the property (CONSTRUCT)', async () => {
        
        var input = {
            propertyURI: propURI
        };
        
        var q = opmProp.restoreProp(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(2);   // Should return a body with length 2 (propURI+stateURI)

    });

    it('Restore the property (INSERT)', async () => {
               
        var q = opmProp.restoreProperty(propURI);

        const res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    /**
     * The property should now hold 4 states:
     * 1) Initial state from when it was created
     * 2) State from when it was updated
     * 3) State from when it was deleted
     * 4) State from when it was restored
     */
    it('Validate property history', async () => {
        
        var q = opmProp.getPropertyHistory(propURI);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(6);   // Should return a body with length 6 (foiURI+propURI+4stateURI)

    });

});

describe("Property reliability - main graph", () => {

    it("Set reliability to 'confirmed' (CONSTRUCT)", async () => {

        var input = {
            propertyURI: propURI,
            userURI: 'http://niras.dk/employees/mhra',
            reliability: 'confirmed'
        };
        
        var q = opmProp.setReliability(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');
        
        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(2);   // Should return a body with length 2 (propURI+stateURI)

    });

    it("Set reliability to 'confirmed' (INSERT)", async () => {
        
        var q = opmProp.confirmProperty(propURI,'http://niras.dk/employees/mhra');

        const res = await query.execute(conn, dbName, q);
        
        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200

    });

    /**
     * The property should now hold 5 states:
     * 1) Initial state from when it was created
     * 2) State from when it was updated
     * 3) State from when it was deleted
     * 4) State from when it was restored
     * 5) State from when the reliability was set to confirmed
     */
    it('Validate property history', async () => {
        
        var q = opmProp.getPropertyHistory(propURI);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(7);   // Should return a body with length 7 (foiURI+propURI+5stateURI)

    });

    /**
     * It should not be possible to update a confirmed property
     */
    it('Try updating the confirmed property (CONSTRUCT)', async () => {
        
        var input = {
            propertyURI: propURI,
            value: '"50 Cel"^^cdt:temperature'
        };
        
        var q = opmProp.putProp(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res.body).to.be.an('array').that.is.empty;               // Should not return any results

    });

    /**
     * It should not be possible to delete a confirmed property
     */
    it('Try deleting the confirmed property (CONSTRUCT)', async () => {
        
        var input = {
            propertyURI: propURI,
            reliability: 'deleted'
        };
        
        var q = opmProp.setReliability(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res).to.have.property('body').that.is.empty;             // Should not return any results

    });

});

describe("Final tests", () => {

    it('No properties can have more than one current state', async () => {
        
        var q = `
        PREFIX  opm: <https://w3id.org/opm#>
        ASK
        WHERE {
            GRAPH ?g {
                { SELECT ?prop (COUNT(?state) AS ?count)
                    WHERE {
                    ?prop opm:hasPropertyState ?state .
                    ?state a opm:CurrentPropertyState .
                } GROUP BY ?prop }
            
                FILTER(?count != 1)
            }
        }`;

        const res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res).to.have.property('body').to.equal(false);           // Should not return any results

    });

});
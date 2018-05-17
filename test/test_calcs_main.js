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

/**
 * GLOBAL SETTINGS
 */
var host = 'https://example.org/';

var mainGraph = true;

var calcURI;

var prefixes = [
    {prefix: 'ex', uri: 'https://example.org/'},
    {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'},
    {prefix: 'props', uri: 'https://w3id.org/product/props/'}
];

let opmProp = new OPMProp(host, prefixes, mainGraph);
let opmCalc = new OPMCalc(host, prefixes, mainGraph);

var context = opmCalc.getJSONLDContext()                // Get JSON-LD formatted context file with known prefixes

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

        it('Assign a property (props:supplyWaterTemperatureHeating) (70 Cel) to all FoIs (INSERT)', async () => {
            
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

        it('Assign a property (props:returnWaterTemperatureHeating) (40 Cel) to all FoIs (INSERT)', async () => {
            
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

describe("Simple tests for postCalc", () => {

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

});

describe("Infer derived properties - main graph", () => {

    /**
     * Add new calculation
     */
    it('Add new calculation (props:returnWaterTemperatureHeating) for ex:FoI1 (CONSTRUCT)', async () => {
        
        var input = {
            label: '"Heating temperature difference for ex:FoI1"@en',
            foiRestriction: 'ex:FoI1',
            argumentPaths: ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr'],
            comment: 'This calculation derives the heating temperature difference for ex:FoI1 as the difference between its supply- and return water temperature',
            userURI: 'https://www.niras.dk/employees/mhra',
            expression: 'abs(?ts-?tr)',
            inferredProperty: 'props:heatingTemperatureDelta'
        };

        var q = opmCalc.postCalcData(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');
        var data = await jsonld.compact(res.body, context);             // Shorten URIs with prefixes ()

        expect(res).to.have.property('status').that.is.equals(200);                 // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(1);   // Should return a body with length 1 (calculationURI)
        expect(data).to.have.deep.any.key('opm:foiRestriction');                    // Should have a FoI restriction
        expect(data).to.have.deep.any.key('rdfs:label');                            // Should have a label
        expect(data).to.have.deep.any.key('rdfs:comment');                          // Should have a comment
        expect(data).to.have.deep.any.key('opm:argumentPaths');                     // Should have argument paths
        expect(data).to.have.deep.any.key('opm:inferredProperty');                  // Should have an inferred property
        expect(data).to.have.deep.any.key('prov:generatedAtTime');                  // Should have a generation time
        expect(data).to.have.deep.any.key('prov:wasAttributedTo');                  // Should be attributed to some user
        
    });

    it('Add new calculation (INSERT)', async () => {
        
        var input = {
            label: '"Heating temperature difference for ex:FoI1"@en',
            foiRestriction: 'ex:FoI1',
            argumentPaths: ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr'],
            comment: 'This calculation derives the heating temperature difference for ex:FoI1 as the difference between its supply- and return water temperature',
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

        // Save URI of the calculation in a global variable
        this.calcURI = res.body[0]['@id'];

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(1);   // Should return a body with length 1 (calculationURI)

    });

    /**
     * This is a demponstration of the steps that should be performed by the server when receiving a POST request to the calculation URI
     * 1) Get calculation data
     * 2) Do an update query
     */
    it('get calculation data and append calculation where applicable (ex:FoI1) -> 30 Cel', async () => {
        
        // STEP 1
        // Get calculation data

        var q = opmCalc.getCalcData({calculationURI: this.calcURI});

        var res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);                // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(1);  // Should return a body with length 1 (calculationURI)

        var data = await jsonld.compact(res.body, context);    // Shorten URIs with prefixes ()

        // STEP 2
        // Post calculation to FoI

        var calculationURI = this.calcURI;
        var expression = data['opm:expression'];
        var inferredProperty = data['opm:inferredProperty']['@id'];
        var argumentPaths = data['opm:argumentPaths']['@list'];
        var foiRestriction = data['opm:foiRestriction']['@id'];
        var q = opmCalc.postByFoI(foiRestriction, inferredProperty, expression, argumentPaths, calculationURI);

        res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    it('Check that the derived property was correctly inserted', async () => {

        var q = opmProp.getFoIProps('ex:FoI1', 'props:heatingTemperatureDelta');

        const res = await query.execute(conn, dbName, q, 'application/ld+json');
        var data = await jsonld.compact(res.body, context);    // Shorten URIs with prefixes ()

        var state = _.filter(data['@graph'], x => x['@type'] && x['@type'].indexOf('opm:CurrentState') != -1 )[0];
        var value = state['opm:valueAtState']['@value'];

        var keys = _.flatten(data['@graph'].map(x => _.keys(x)));

        expect(res).to.have.property('status').that.is.equals(200);         // Should return status 200
        expect(Number(value)).to.equal(30);                                 // Should be 30
        expect(keys).to.include.members(['props:heatingTemperatureDelta']); // Should have key props:heatingTemperatureDelta

    });

    /**
     * It should not be possible to append the property if it is already defined
     */
    it('Re-append calculation to ex:FoI1 (CONSTRUCT)', async () => {
        
        var input = {
            label: '"Calculation 1"@en',
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
     * Appending the property by path should assign it to all instances of bot:Element and therefore not to ex:FoI4 which is a bot:Space
     * The query should append the property to ex:FoI2 and ex:FoI3
     * ex:FoI1 already has a props:heatingTemperatureDelta property assigned by another calculation
     */
    it('Post derived property props:heatingTemperatureDelta by path (?foi a bot:Element) (INSERT)', async () => {

        // STEP 1
        // Add calculation

        var input = {
            label: '"Heating temperature difference for all bot:Element instances"@en',
            pathRestriction: '?foi a bot:Element',
            argumentPaths: ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr'],
            comment: 'This calculation derives the heating temperature difference for all bot:Element instances as the difference between its supply- and return water temperature',
            userURI: 'https://www.niras.dk/employees/mhra',
            expression: 'abs(?ts-?tr)',
            inferredProperty: 'props:heatingTemperatureDelta',
            queryType: 'insert'
        };

        var q = opmCalc.postCalcData(input);

        var res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

        // STEP 2
        // Get calculation data

        q = opmCalc.getCalcData({label: input.label});
        
        res = await query.execute(conn, dbName, q, 'application/ld+json');
        
        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        var data = await jsonld.compact(res.body[0], context);          // Shorten URIs with prefixes ()

        expect(data).to.have.deep.any.key('opm:pathRestriction');                   // Should have a path restriction
        expect(data).to.have.deep.any.key('rdfs:label');                            // Should have a label
        expect(data).to.have.deep.any.key('rdfs:comment');                          // Should have a comment
        expect(data).to.have.deep.any.key('opm:argumentPaths');                     // Should have argument paths
        expect(data).to.have.deep.any.key('opm:inferredProperty');                  // Should have an inferred property
        expect(data).to.have.deep.any.key('prov:generatedAtTime');                  // Should have a generation time
        expect(data).to.have.deep.any.key('prov:wasAttributedTo');                  // Should be attributed to some user

        // STEP 3
        // Post to FoIs matching the path

        var calculationURI = data['@id'];
        var expression = data['opm:expression'];
        var inferredProperty = data['opm:inferredProperty']['@id'];
        var argumentPaths = data['opm:argumentPaths']['@list'];
        var pathRestriction = data['opm:pathRestriction'];

        q = opmCalc.postByPath(pathRestriction, inferredProperty, expression, argumentPaths, calculationURI);

        res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    it('Confirm that the properties were correctly inserted', async () => {
    
        var q = opmProp.getPropsByType('props:heatingTemperatureDelta', 'construct');

        res = await query.execute(conn, dbName, q, 'application/ld+json');
        var ids = res.body.map(x => x['@id']);

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200
        expect(ids).to.not.include('https://example.org/FoI4');         // Should not be assigned to ex:FoI4

    });
    

});

describe("Make changes to arguments - main graph", () => {

    /**
     * There should not be any outdated properties at this point
     */
    it('Verify that there are no outdated properties (CONSTRUCT)', async () => {

        var q = opmCalc.listAllOutdated();

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200
        expect(res).to.have.property('body').to.be.empty;           // Should not return any results

    });

    it('Update property (props:supplyWaterTemperatureHeating) (65 Cel) for all bot:Element instances', async () => {
        
        var q = opmProp.putByPath('?foi a bot:Element', 'props:supplyWaterTemperatureHeating', '"65"^^xsd:decimal', 'assumed');

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200);     // Should return status 200

    });

    /**
     * There should now be 3 outdated properties
     */
    it('Confirm that the list of outdated properties now includes ex:FoI1, ex:FoI2 and ex:FoI3', async () => {
        
        var q = opmCalc.listAllOutdated();

        const res = await query.execute(conn, dbName, q, 'application/ld+json');
        var data = await jsonld.compact(res.body, context);    // Shorten URIs with prefixes ()
        var ids = data['@graph'].map(x => x['@id']);

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200
        expect(ids).to.include.members(['ex:FoI1', 'ex:FoI2', 'ex:FoI3']);

    });

    it('List outdated properties for ex:FoI1', async () => {
        
        var q = opmCalc.listOutdatedByFoI('ex:FoI1');

        const res = await query.execute(conn, dbName, q, 'application/ld+json');
        var data = await jsonld.compact(res.body, context);    // Shorten URIs with prefixes ()
        var ids = data['@graph'].map(x => x['@id']);
        var keys = _.flatten(data['@graph'].map(x => _.keys(x)));

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200
        expect(ids).to.include.members(['ex:FoI1']);   // Should have member ex:FoI1
        expect(keys).to.include.members(['props:heatingTemperatureDelta','seas:evaluation','prov:wasDerivedFrom']);

        var state = _.filter(data['@graph'], x => x['@type'] && x['@type'].indexOf('opm:CurrentState') != -1 )[0];

        // console.log(JSON.stringify(data['@graph'],null,2))

        // Save the calculation URI
        // this.calcURI = state['prov:wasAttributedTo']['@id'];

    });

    it('Update derived property props:heatingTemperatureDelta for ex:FoI1', async () => {

        // STEP 1
        // Get data from the calculation that initially created the derived property

        var foiURI = 'ex:FoI1';
        var property = 'props:heatingTemperatureDelta';

        var q = opmCalc.getCalcDataByFoI(foiURI, property);

        var res = await query.execute(conn, dbName, q, 'application/ld+json');
        var data = await jsonld.compact(res.body, context);    // Shorten URIs with prefixes ()

        // Define missing variables retrieved from the calculation resource
        var calculationURI = data['@id'];
        var expression = data['opm:expression'];
        var argumentPaths = data['opm:argumentPaths']['@list'];
        var userURI = 'https://www.niras.dk/employees/mhra';

        // STEP 2
        // Update the property

        q = opmCalc.putByFoI(foiURI, property, expression, argumentPaths, calculationURI, userURI);

        res = await query.execute(conn, dbName, q);

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200

    });

    /**
     * There should now be 2 outdated properties
     */
    it('Confirm that the list of outdated properties now includes only ex:FoI2 and ex:FoI3', async () => {
        
        var q = opmCalc.listAllOutdated();

        const res = await query.execute(conn, dbName, q, 'application/ld+json');
        var data = await jsonld.compact(res.body, context);    // Shorten URIs with prefixes ()
        var ids = data['@graph'].map(x => x['@id']);

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200
        expect(ids).to.include.members(['ex:FoI2', 'ex:FoI3']);
        expect(ids).to.not.include.members(['ex:FoI1']);

    });

    it('Check that ex:FoI1 has no outdated properties', async () => {
        
        var q = opmCalc.listOutdatedByFoI('ex:FoI1');

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200
        expect(res).to.have.property('body').to.be.empty;   // Should return a body with length 3 (foiURI+propURI+stateURI)

    });

    /**
     * Get the subscribers (ie properties that will be affected when the property changes)
     */
    it('Get the subscribers of property props:supplyWaterTemperatureHeating of ex:FoI1', async () => {
        
        var input = {
            foiURI: 'ex:FoI1',
            property: 'props:supplyWaterTemperatureHeating'
        }

        var q = opmCalc.getSubscribers(input);

        const res = await query.execute(conn, dbName, q, 'application/ld+json');

        expect(res).to.have.property('status').that.is.equals(200); // Should return status 200
        expect(res).to.have.property('body').to.be.an('array').to.have.length(1);   // Should return a body with length 1

    });

    /**
     * Testing the extended post calc method
     */
    // it('Calculate the product of supply- and return water temperature - insert globally and add calculation resource at the same time', async () => {
        
    //     var input = {
    //         label: '"temp product"@en',
    //         argumentPaths: ['?foi props:supplyWaterTemperatureHeating ?ts', '?foi props:returnWaterTemperatureHeating ?tr'],
    //         comment: 'This calculation sums the supply- and return water temperature for heating',
    //         userURI: 'https://www.niras.dk/employees/mhra',
    //         expression: '?ts+?tr',
    //         inferredProperty: 'props:heatingTemperatureSum',
    //         queryType: 'construct'
    //     };

    //     var q = opmCalc.postCalcExtended(input);

    //     // var res = await query.execute(conn, dbName, q);

    //     // expect(res).to.have.property('status').that.is.equals(200); // Should return status 200

    //     // q = opmCalc.getCalcDataByLabel(input.label);

    //     console.log(q);

    //     // res = await query.execute(conn, dbName, q, 'application/ld+json');

    //     // // Currently not working. Should only yeild one claculation URI!

    //     // console.log(res);

    // });

});
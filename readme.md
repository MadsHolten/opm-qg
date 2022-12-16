# OPM query generator: Query generator for Property Management
Manage interdependent and typed properties as well as their interdependencies, history and validity for properties assigned to any Feature of Interest (FoI).

### Installation

OPM query generator requires [Node.js](https://nodejs.org/) v4+ to run.

Install it to your project

```sh
$ npm install https://github.com/MadsHolten/opm-qg.git
```

### Compile
```sh
$ tsc install https://github.com/MadsHolten/opm-qg.git
```

### Methods
**Calculations**
* **postCalc()** - Checks for FoIs that match the pattern, that do not have the inferred property. Creates a property with a new URI and a first state containing calculation data + result.
* **putCalc()** - Checks for FoIs that match the pattern, that already have the inferred property, but where one or more of the arguments of the latest state have changed since last calculation. Creates a new state and attaches it to the inferred property.
* **listOutdated()** - Returns a full list of calculated properties where one or more of the arguments of the expression have changed since last time the calculation was updated.

**Properties**
* **postFoIProp()** - Attach a new property to either a specific FoI or to all FoIs matching a specified pattern.
* **putFoIProp()** - Update a property of either a specific FoI or of all FoIs matching a specified pattern.
* **getProps()** - Get properties and state values of FoI(s). Constrain to specific FoI and/or property type. Return full property history or only latest state. List only deleted, assumed or derived properties.
* **setReliability()** - Set the reliability of a property as either 'deleted', 'confirmed' or 'assumption'
* **restoreProp()** - Restore a deleted property by reinferring the latest state with a value assigned to it.
* **putProp()** - Update a property

### Calculation examples

#### Example 1
##### Properties exist directly on the FoI
##### postCalc() // putCalc()
If the property exists on the FoI itself the following input will construct a new (or update existing if using put) "seas:fluidTemperatureDifference"-property for all FoIs that have a "seas:fluidSupplyTemperature" and a "seas:fluidReturnTemperature".

The calculation is defined with the expression variable, and the arguments are defined in the argument paths as a triple pattern originating from the FoI to which the new property should be infered.
The result will get a unit °C and datatype cdt:temperature. This prefix cdt is not defined as default and must be defined under prefixes.

```javascript
var qg = require("opm-query-generator");
var input = {
    calculationURI: 'https://localhost/opm/Calculation/0c69e6a2-5146-45c3-babb-2ecea5f5d2c9',
    expression: 'abs(?ts-?tr)',
    inferredProperty: 'seas:fluidTemperatureDifference',
    argumentPaths: ['?foi seas:fluidSupplyTemperature ?ts', '?foi seas:fluidReturnTemperature ?tr'],
    unit: {
        value: '°C',
        datatype: 'cdt:temperature'
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ]
};
var pmqg = new qg.OPMCalc(input);
var query = pmqg.postCalc();
console.log("Post calculation");
console.log(query);
var query = pmqg.putCalc();
console.log("Put calculation");
console.log(query);
```

#### Example 2
##### Properties do not exist directly on the FoI
##### postCalc() // putCalc()
Used if the properties do not exist on the FoI itself, but exist on a FoI that has a connection to the FoI.

An argument path for the argument is specified. It is given by a triple pattern, and it should start with the FoI itself using the "?foi" variable.

The name of the argument (target) variable can be anything, but the following variables are reserved, and cannot be used:

*?propertyURI, ?stateURI, ?_res, ?res, ?now, ?eval:n, ?t_:n, ?t:n, ?g, ?gi, ?t_c, ?tc, ?_v:n, ?arg:n, ?guid* where :n is the number of the argument.

In the example, we are looking for a property that exists on the super system of the flow system itself. 
```javascript
var input = {
    argumentPaths: [
        '?foi seas:subFlowSystemOf/seas:fluidSupplyTemperature ?ts', 
        '?foi seas:subFlowSystemOf/seas:fluidReturnTemperature ?tr'
    ], ...
};
```

#### Example 3
##### Properties of a specific FoI
##### postCalc() // putCalc()
Sometimes it might be necessary to specify the calculation so that it is only valid for a specific FoI. It is possible to do this by explicitly specifying a FoI URI.

Argument paths etc. work the same way as illustrated in examples 1 and 2.
```javascript
var input = {
    ...
    foiURI: 'https://localhost/seas/HeatingSystem/6626b0b1-3578-4f1e-a6ec-91c7c59fb143', ...
};
```

### Property examples

#### Example 1
##### Add/update property to a specific FoI
##### postFoIProp() // putFoIProp()
Simply use postFoIProp() for attaching a new property (if not already exists) or putFoIProp() to update an existing one.
```javascript
var input = {
    value: {
        unit: 'Cel',
        datatype: 'cdt:ucum',
        property: 'seas:fluidSupplyTemperature',
        value: '70'
    },
    prefixes: [
        { prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#' }
    ],
    foiURI: 'https://localhost/seas/HeatingSystem/1'
};
```

#### Example 2
##### Add/update property to all FoIs matching a pattern
##### postFoIProp() // putFoIProp()
Simply use postFoIProp() for attaching new properties (if not already exists) or putFoIProp() to update existing ones.

A pattern is given as a triple pattern, and it must start with the FoI itself using the "?foi" variable.

The following variables are reserved, and cannot be included in the pattern:

*?propertyURI, ?evaluationURI, ?now, ?val, ?guid, ?eval*

In the example a 'seas:fluidSupplyTemperature' is added to all FoIs of type 'seas:HeatingSystem'.

Value and prefixes are the same as illustrated in the previous example.
```javascript
var input = {
    ...
    pattern: '?foi a seas:HeatingSystem'
};
```

#### Example 3
##### Latest evaluation and value of a property of a FoI
##### getProps()
Returns properties, metadata about their states and the FoI to which they are assigned.

Optional 'latest: true' returns only the latest state.
Optional 'language: ISO-CODE' returns only a specific label language. Defaults to 'en'.
Optional 'queryType: select/construct' returns either a set of variables (select) or a subset of the graph (construct).
Optional 'restriction: deleted/assumptions/derived/confirmed' returns only properties that are deleted, assumed, derived or confirmed.
Optional 'foiURI: https://:host/:db/:foi/:guid' returns only properties of a specific FoI.
Optional 'propertyURI: seas:propertyType' returns only a specific property. Given either by prefix or full URI.
```javascript
var input = {
    foiURI: "https://localhost/opm/HeatingSystem/1",
    property: "https://w3id.org/seas/fluidSupplyTemperature",
    language: "en",
    latest: "true",
    queryType: "construct",
    restriction: "derived"
};
```

#### Example 4
##### Get single property
##### getProps()
Optional 'latest: true' returns only the latest state.
```javascript
var input = {
    propertyURI: "https://localhost/opm/Property/3b5b00d8-9bcc-4a58-aba2-df059b5ded97",
    latest: true
};
```

#### Example 5
##### Delete a property
##### setReliability()
Adds a new state with the property as an instance of opm:Deleted.
```javascript
var input = {
    propertyURI: 'https://localhost/opm/Property/3b5b00d8-9bcc-4a58-aba2-df059b5ded97',
    reliability: 'deleted'
};
```

#### Example 6
##### Restore deleted property
##### restoreProp()
Restore a deleted property by reinferring the latest state with a value assigned to it.
```javascript
var input = {
    propertyURI: 'https://localhost/opm/Property/3b5b00d8-9bcc-4a58-aba2-df059b5ded97'
};
```

#### Example 7
##### Confirm property
##### setReliability()
Confirm a property. A user URI must be assigned.

WIP: Optionally it should also be possible to assign documentation.
```javascript
var input = {
    propertyURI: 'https://localhost/opm/Property/3b5b00d8-9bcc-4a58-aba2-df059b5ded97',
    userURI: 'https://niras.dk/employees/mhra',
    reliability: 'confirmed'
};
```

#### Example 8
##### State argument as an assumption
##### setReliability()
State a property as an assumption. A user URI must be assigned.
```javascript
var input = {
    propertyURI: 'https://localhost/opm/Property/3b5b00d8-9bcc-4a58-aba2-df059b5ded97',
    userURI: 'https://niras.dk/employees/mhra',
    reliability: 'assumption'
};
```

#### Example 9
##### List subscribers
##### listSubscribers()
Get a list of subscribers of a property (a derived property that takes the property as an argument)
```javascript
var input = {
    propertyURI: 'https://localhost/opm/Property/6daf0c7a-f1cb-4a14-ac53-4156c2fe4cc1'
};
```

#### Example 10
##### Update a property
##### putProp()
Update an existing property.
Will not update if it is deleted or confirmed.
```javascript
var input = {
    propertyURI: 'https://localhost/opm/Property/6befd4d2-eb2a-4c4d-9597-e4b612d6dfcc',
    userURI: 'https://niras.dk/employees/mhra',
    reliability: 'assumption',
    value: {
        unit: 'Cel',
        datatype: 'cdt:ucum',
        property: 'seas:fluidSupplyTemperature',
        value: '72'
    },
    prefixes: [
        { prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#' }
    ]
};
```

#### Example 11
##### List outdated
##### listOutdated()
List all updated properties or just the ones related to a specific FoI given by its URI.

# Calling an endpoint
Example of how a SPARQL endpoint can be called using request-promise
```javascript
import * as rp from "request-promise";
var qg = require("opm-query-generator");

var input = {
    args: [
        { property: 'seas:fluidSupplyTemperature' },
        { property: 'seas:fluidReturnTemperature' }
    ],
    result: {
        unit: 'Cel',
        datatype: 'cdt:ucum',
        property: 'seas:fluidTemperatureDifference',
        calc: 'abs(?arg1-?arg2)'
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ]
};

var pmqg = new qg.OPMCalc(input);
var query = pmqg.postCalc();

var dboptions = {
    uri: 'http://host/proj/query',
    auth: {
        username: 'user',
        password: 'pw'
    },
    method: 'GET',
    qs: {query: query},
    headers: { 
        'Accept': 'application/n-triples' 
    }
}
return rp(dboptions)
        .then(d => {
            if(!d){
                err = "All calculated values are up to date";
                throw err;
            }else{
                //Isert the triples in the named graph
                var q: string = `INSERT DATA {
                                 GRAPH <${graphURI}> { ${d} }}`;
                dboptions.qs = {query: query};
                dboptions.method = 'POST';
                dboptions.uri = 'http://host/proj/update';
                dboptions.headers = {'Accept': 'application/n-triples'};
                return rp(dboptions);
            }
        }).then(d => {
            return 'Successfully added calculations';
        }
        .catch(err => {
            next(err);
        });
```

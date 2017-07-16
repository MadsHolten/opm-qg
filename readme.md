# OPM query generator: Query generator for Property Management

### Installation

OPM query generator requires [Node.js](https://nodejs.org/) v4+ to run.

Install it to your project

```sh
$ npm install https://github.com/MadsHolten/opm-qg.git#0.1.9
```

### Methods
**Calculations**
* **postCalc()** - Checks for resources that match the pattern, that do not have the inferred property. Creates a property with a new URI and a first state containing calculation data + result.
* **putCalc()** - Checks for resources that match the pattern, that already have the inferred property, but where one or more of the arguments of the latest state have changed since last calculation. Creates a new state and attaches it to the inferred property.
* **listOutdated()** - Returns a full list of calculated properties where one or more of the arguments of the expression have changed since last time the calculation was updated.

**Properties**
* **postResourceProp()** - Attach a new property to either a specific resource or to all resources matching a specified pattern.
* **putResourceProp()** - Update a property of either a specific resource or of all resources matching a specified pattern.
* **getResourceProp()** - Get a specific property of a resource. Use URL Parameter latest=true to return only the latest state.
* **getResourceProps()** - Get all properties of a resource. Use URL Parameter latest=true to return only the latest states.
* **getProp()** - Get data about a specific property. Use URL Parameter latest=true to return only the latest states.
* **deleteProp()** - Delete a specific property by adding a new state with opm:deleted set to true.
* **restoreProp()** - Restore a deleted property by reinferring the latest state with a value assigned to it.
* **putProp()** - **WIP**
* **listDeleted** - Get a full list of properties that have been deleted.

### Calculation examples

#### Example 1
##### Properties exist directly on the resource
If the property exists on the resource itself the following input will construct a new "seas:fluidTemperatureDifference"-property for all resources that have a "seas:fluidSupplyTemperature" and a "seas:fluidSupplyTemperature".
The calculation is defined with the calc variable, and the arguments are referred to by their location in the args list (?arg1, ?arg2, ... ?arg:n). The result will get a unit Cel and datatype cdt:ucum. This prefix is not defined as default and must be defined under prefixes.

```javascript
var seas_calc = require("seas-query-generator");
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
var sqg = new seas_calc.SeasCalc(input);
var query = sqg.postCalc();
console.log(query);
```

#### Example 2
##### Properties do not exist directly on the resource
Used if the properties do not exist on the resource itself, but exist on a resource that has a connection to the resource itself.
A target path for the argument is specified. It is given by a triple pattern, and it must start with the resource itself using the "?resource" variable. 
The name of the target variable can be anything, but the following variables are reserved, and cannot be used:
?propertyURI, ?stateURI, *?_res, ?res, ?now, ?eval:n, ?t_:n, ?t:n, ?g, ?gi, ?t_c, ?tc, ?_v:n, ?arg:n, ?guid* where :n is the number of the argument.
In the example, we are looking for a property that exists on the super system of the flow system itself. 
```javascript
var input = {
    args: [
        { property: 'seas:fluidSupplyTemperature',
          targetPath: '?resource seas:subFlowSystemOf ?target' },
        { property: 'seas:fluidReturnTemperature',
          targetPath: '?resource seas:subFlowSystemOf ?target' }
    ], ...
};
```

#### Example 3
##### Properties of a specific resource
Sometimes it might be necessary to specify the calculation so that it is only valid for a specific resource. It is possible to do this by explicitly specifying a resource URI.
Properties and paths work the same way as illustrated in examples 1 and 2.
```javascript
var input = {
    ...
    resourceURI: 'https://localhost/seas/HeatingSystem/6626b0b1-3578-4f1e-a6ec-91c7c59fb143', ...
};
```

### Property examples

#### Example 1
##### Add/update property to a specific resource
Simply use postProp() for attaching a new property (if not already exists) or putProp() to update an existing one.
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
    resourceURI: 'https://localhost/seas/HeatingSystem/1'
};
```

#### Example 2
##### Add property to all resources matching a pattern
Simply use postProp() for attaching new properties (if not already exists) or putProp() to update existing ones.
A pattern is given as a triple pattern, and it must start with the resource itself using the "?resource" variable.
The following variables are reserved, and cannot be included in the pattern:
?propertyURI, ?evaluationURI, ?now, ?val, ?guid, ?eval

In the example a 'seas:fluidSupplyTemperature' is
added to all resources of type 'seas:HeatingSystem'
```javascript
var input = {
    value: {
        unit: 'Cel',
        datatype: 'cdt:ucum',
        property: 'seas:fluidSupplyTemperature',
        value: '70'
    },
    prefixes: [
        {prefix: 'cdt', uri: 'http://w3id.org/lindt/custom_datatypes#'}
    ],
    pattern: '?resource a seas:HeatingSystem'
};
```


# Calling an endpoint
Example of how a SPARQL endpoint can be called using request-promise
```javascript
import * as rp from "request-promise";
var seas_calc = require("seas-query-generator");

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

var sqg = new seas_calc.SeasCalc(input);
var query = sqg.postCalc();

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

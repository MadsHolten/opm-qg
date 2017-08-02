"use strict";
var qgen = require("../../dist/index");

var input = {  
   "propertyURI":"https://localhost/opm/Property/91614476-83f6-4f3b-b911-51504ae5b03d",
   "prefixes":[  
      {  
         "prefix":"cdt",
         "uri":"http://w3id.org/lindt/custom_datatypes#"
      }
   ],
   "value":{  
      "value":"40",
      "datatype":"cdt:ucum",
      "unit":"Cel"
   }
}
var sp = new qgen.OPMProp(input);
var q = sp.putProp();
console.log(q);
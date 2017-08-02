"use strict";
var qgen = require("../../dist/index");

var input = {  
   "foiURI":"https://localhost/opm/HeatingSystem/1",
   "prefixes":[  
      {  
         "prefix":"cdt",
         "uri":"http://w3id.org/lindt/custom_datatypes#"
      }
   ],
   "value":{  
      "value":"40",
      "datatype":"cdt:ucum",
      "property":"seas:fluidReturnTemperature",
      "unit":"Cel"
   }
}
var sp = new qgen.OPMProp(input);
var q = sp.postFoIProp();
console.log(q);
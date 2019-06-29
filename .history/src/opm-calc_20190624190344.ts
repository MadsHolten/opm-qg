import * as _ from "lodash";
import * as _s from "underscore.string";
import { BaseModel } from "./base";
import { Prefix, Literal, Base } from "./base";

interface GetCalc {
    calculationURI?: string; //to return results only for a specific calculation
    foiURI?: string;
    queryType?: string;
    label?: string;
    property?: string;
}

export interface PostCalcData extends Base {
    label?: string;
    foiRestriction?: string;
    pathRestriction?: string;
    hostURI: string; //Needed as there is nothing else to extract it from
    expression: string;
    argumentPaths: string[];
    type?: string;
    inferredProperty: InferredProperty;
}

export interface PostPutCalc extends Base {
    calculationURI?: string;
    expression: string;
    argumentPaths: string[];
    inferredProperty: string;
    type?: string;
    path?: string;
    unit?: Literal;     //optional
    foiURI?: string;    //if only applicable to a specific FoI
}

interface InferredProperty {
    propertyURI: string;
    unit?: Literal;
}

export class OPMCalc extends BaseModel {

    /**
     * GET CALC DATA BY FoI
     * @param foiURI    URI of the Feature of Interest (FoI) holding the derived property
     * @param property  URI of the derived property
     */
    public getCalcDataByFoI(foiURI: string, property: string){
        
        var input: GetCalc = {
            foiURI: foiURI,
            property: property
        }
        
        return this.getCalcData(input);
    }

    public getCalcDataByLabel(label: string){
        
        var input: GetCalc = {
            label: label
        }

        return this.getCalcData(input);
    }

    /**
     * POST CALCULATION BY FoI
     * Assign derived value to specific Feature of Interest (FoI)
     * @param foiURI            URI of the Feature of Interest (FoI) holding the property that is to be created
     * @param inferredProperty  URI of the property that will be inferred
     * @param expression        expression to be executed in order to calculate value. Arguments must match the ones used in argument paths
     * @param argumentPaths     Array of paths from the ?foi to the arguments required by the expression
     * @param calculationURI    URI of the calculation (where the calculation details are stored)
     * @param userURI           URI of the user who assigned the property (optional)
     * @param comment           comment - why was it assigned? (optional)
     */
    public postByFoI(foiURI: string, inferredProperty: string, expression: string, argumentPaths: string[], calculationURI: string, userURI?: string, comment?: string){
        var input: PostPutCalc = {
            host: this.host,
            foiURI: foiURI,
            inferredProperty: inferredProperty,
            expression: expression,
            argumentPaths: argumentPaths,
            calculationURI: calculationURI,
            userURI: userURI,
            comment: comment,
            queryType: 'insert'
        }
        return this.postCalc(input);
    }

    /**
     * POST BY PATH
     * Assign derived value to anything matching the path
     * @param path              Path to be matched to find Feature of Interest (FoI)
     * @param inferredProperty  URI of the property that will be inferred
     * @param expression        expression to be executed in order to calculate value. Arguments must match the ones used in argument paths
     * @param argumentPaths     Array of paths from the ?foi to the arguments required by the expression
     * @param calculationURI    URI of the calculation (where the calculation details are stored)
     * @param userURI           URI of the user who assigned the property (optional)
     * @param comment           comment - why was it assigned? (optional)
     */
    public postByPath(path: string, inferredProperty: string, expression: string, argumentPaths: string[], calculationURI: string, userURI?: string, comment?: string){
        var input: PostPutCalc = {
            host: this.host,
            path: path,
            inferredProperty: inferredProperty,
            expression: expression,
            argumentPaths: argumentPaths,
            calculationURI: calculationURI,
            userURI: userURI,
            comment: comment,
            queryType: 'insert'
        }
        return this.postCalc(input);
    }

    /**
     * POST CALCULATION GLOBALLY
     * Assign derived value to any FoI where the argument paths can be matched
     * @param inferredProperty  URI of the property that will be updated
     * @param expression        expression to be executed in order to calculate value. Arguments must match the ones used in argument paths
     * @param argumentPaths     Array of paths from the ?foi to the arguments required by the expression
     * @param calculationURI    URI of the calculation (where the calculation details are stored)
     * @param userURI           URI of the user who assigned the property (optional)
     * @param comment           comment - why was it assigned? (optional)
     */
    public postGlobally(inferredProperty: string, expression: string, argumentPaths: string[], calculationURI: string, userURI?: string, comment?: string){
        var input: PostPutCalc = {
            host: this.host,
            inferredProperty: inferredProperty,
            expression: expression,
            argumentPaths: argumentPaths,
            calculationURI: calculationURI,
            userURI: userURI,
            comment: comment,
            queryType: 'insert'
        }
        return this.postCalc(input);
    }

    /**
     * UPDATE CALCULATION BY FoI
     * Re-calculate and re-assign derived value to a specific FoI
     * @param foiURI            URI of the Feature of Interest (FoI) holding the property that is to be updated
     * @param inferredProperty  URI of the property that will be updated
     * @param expression        expression to be executed in order to calculate value. Arguments must match the ones used in argument paths
     * @param argumentPaths     Array of paths from the ?foi to the arguments required by the expression
     * @param calculationURI    URI of the calculation (where the calculation details are stored)
     * @param userURI           URI of the user who assigned the property (optional)
     * @param comment           comment - why was it assigned? (optional)
     */

    public putByFoI(foiURI: string, inferredProperty: string, expression: string, argumentPaths: string[], calculationURI:string, userURI?: string, comment?: string){
        var input: PostPutCalc = {
            host: this.host,
            foiURI: foiURI,
            inferredProperty: inferredProperty,
            expression: expression,
            argumentPaths: argumentPaths,
            calculationURI: calculationURI,
            userURI: userURI,
            comment: comment,
            queryType: 'insert'
        }
        return this.putCalc(input);
    }

    /**
     * UPDATE CALCULATION GLOBALLY
     * Re-calculate and re-assign derived value to any FoI wher the argument paths can be matched
     * @param inferredProperty  URI of the property that will be inferred
     * @param expression        expression to be executed in order to calculate value. Arguments must match the ones used in argument paths
     * @param argumentPaths     Array of paths from the ?foi to the arguments required by the expression
     * @param calculationURI    URI of the calculation (where the calculation details are stored)
     * @param userURI           URI of the user who assigned the property (optional)
     * @param comment           comment - why was it assigned? (optional)
     */
    public putGlobally(inferredProperty: string, expression: string, argumentPaths: string[], calculationURI:string, userURI?: string, comment?: string){
        var input: PostPutCalc = {
            host: this.host,
            inferredProperty: inferredProperty,
            expression: expression,
            argumentPaths: argumentPaths,
            calculationURI: calculationURI,
            userURI: userURI,
            comment: comment,
            queryType: 'insert'
        }
        return this.putCalc(input);
    }

    public listAllOutdated(){
        return this.getOutdated();
    }

    public listOutdatedByFoI(foiURI: string){
        return this.getOutdated(foiURI);
    }

    postCalcData(input: PostCalcData) {

        // Get global variables
        var host = this.host;
        var namedGraphs = this.namedGraphs ? this.namedGraphs.map(uri => this.cleanURI(uri)) : null;
        var iGraph = this.cleanURI(this.iGraph);   // New triples should be inferred in the I-Graph

        // Define variables
        var label = this.cleanLiteral(input.label);
        var expression = this.cleanLiteral(input.expression);
        var argumentPaths = this.cleanArgPaths(input.argumentPaths).paths;
        var argumentVars = this.cleanArgPaths(input.argumentPaths).vars;
        var propertyURI = this.cleanURI(input.inferredProperty);

        // Optional
        var comment = this.cleanLiteral(input.comment);
        var userURI = this.cleanURI(input.userURI);
        var queryType = input.queryType ? input.queryType : this.queryType;     // Get default if not defined
        var foiRestriction = this.cleanURI(input.foiRestriction);
        var pathRestriction = this.cleanLiteral(input.pathRestriction);

        // Process variables
        var expressionVars = this.uniqueVarsInString(expression);

        // Validate
        if(!label) return new Error('Please specify a label');
        if(!propertyURI) return new Error('Please specify a URI for the property that will be inferred by the calculation');
        if(!expression) return new Error('Please specify an expression');
        if(!argumentPaths) return new Error(`Specify ${expressionVars.length} argument path(s)`);
        if(expressionVars.length != argumentPaths.length) return new Error('There is a mismatch between number of arguments used in the expression and the number of argument paths given');

        // NB! In below slice prevents the sort() from changing the original order
        if(!_.isEqual(expressionVars.sort(), argumentVars.slice().sort())) return new Error(`There is a mismatch between the arguments given in the expression (${expressionVars.sort()}) and the arguments given in the paths (${argumentVars.sort()})`);

        //Make sure that argument paths begin with ?foi
        argumentPaths = _.map(argumentPaths, path => {
            var firstSubjectVar = _s.strLeft(_s.strRight(path, '?'), ' ');
            return path.replace('?'+firstSubjectVar, '?foi'); //Replace with ?foi
        })
        
        var q: string = '';

        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';
        var d = queryType != 'insert' ? '' : '\t';
        
        if(queryType == 'construct') q+= '\nCONSTRUCT {\n';
        if(queryType == 'insert') {
            q+= '\nINSERT {\n';
            if(!this.mainGraph) q+= `\tGRAPH ${iGraph} {\n`;
        }

        q+= `${d}\t?calculationURI a opm:Calculation ;\n` +
            `${d}\t\trdfs:label ${label} ;\n`;
        
        if(comment) q+= `${d}\t\trdfs:comment ${comment} ;\n`;
        if(userURI) q+= `${d}\t\tprov:wasAttributedTo ${userURI} ;\n`;
        if(foiRestriction) q+= `${d}\t\topm:foiRestriction ${foiRestriction} ;\n`;
        if(pathRestriction) q+= `${d}\t\topm:pathRestriction ${pathRestriction} ;\n`;
        if(expression) q+= `${d}\t\topm:expression ${expression} ;\n`;

        q+= `${d}\t\tprov:generatedAtTime ?now ;\n` +
            `${d}\t\topm:inferredProperty ${propertyURI} ;\n` +
            `${d}\t\topm:argumentPaths (\n`;
        
        _.each(argumentPaths, (obj, i) => {
            q+= `${d}\t\t\t"${argumentPaths[i]}" `;
            q+= (argumentPaths.length == Number(i)+1) ? ') .\n' : '\n';
        })

        if(!this.mainGraph && queryType == 'insert') q+= c;

        q+= `}\n`;

        if(queryType == 'construct' && namedGraphs) namedGraphs.forEach(uri => q+= `FROM NAMED ${uri}\n`);
        if(queryType == 'insert' && namedGraphs) namedGraphs.forEach(uri => q+= `USING NAMED ${uri}\n`);

        q+= 'WHERE {\n' +
            `\t# CREATE CALCULATION URI AND GET CURRENT TIME\n` +
            `\tBIND(URI(CONCAT(STR("${host}"), "calculations/", STRUUID())) AS ?calculationURI)\n` +
            `\tBIND(now() AS ?now)\n` +
            '}';

        return this.appendPrefixesToQuery(q);
    }


    getCalcData(input: GetCalc) {

        // Global variables
        var mainGraph = this.mainGraph;
        var iGraph = this.cleanURI(this.iGraph);
        var namedGraphs = this.namedGraphs ? this.namedGraphs.map(uri => this.cleanURI(uri)) : null;

        if(input){
            if(input.calculationURI) var calculationURI = this.cleanURI(input.calculationURI);
            if(input.label) var label = this.cleanLiteral(input.label);
            if(input.foiURI) var foiURI = this.cleanURI(input.foiURI);
            if(input.property) var property = this.cleanURI(input.property);
        }

        if(foiURI && !property) return new Error('Please specify the derived property of the FoI');

        var q: string = '';

        // define a few variables to use with named graphs
        var a = mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = mainGraph ? '' : '\t';
        var c = mainGraph ? '' : '\t}\n';

        q+= 'CONSTRUCT {\n' +
            '\t?calculationURI ?key ?val ;\n';
        
        if(!mainGraph) q+= '\t\tsd:namedGraph ?g ;\n';

        q+= '\t\topm:argumentPaths ?list .\n' +
            '\t?listRest rdf:first ?head ;\n' +
            '\t\trdf:rest ?tail .\n' +
            '}\n';
        
        if(namedGraphs) namedGraphs.forEach(uri => q+= `FROM NAMED ${uri}\n`);

        q+= 'WHERE {\n';

        if(calculationURI) q+= `\tBIND(${calculationURI} AS ?calculationURI)\n`;
        if(label) q+= `\tBIND(${label} AS ?label)\n`;
        if(foiURI) q+= `\tBIND(${foiURI} AS ?foiURI)\n`;

        if(foiURI && property){
            if(!mainGraph) q+= `\tGRAPH ${iGraph} {\n`;
            q+= `${b}\t?foiURI ${property}/opm:hasPropertyState [\n` +
            `${b}\t\ta opm:Derived ;\n` +
            `${b}\t\tprov:wasAttributedTo ?calculationURI ] .\n\n`;
            q+= c;
        }

        q+= a;

        q+= `${b}\t?calculationURI ?key ?val ;\n`;

        if(label) q+= `${b}\t\trdfs:label ?label ;\n`;

        q+= `${b}\t\topm:argumentPaths ?list .\n` +
            `${b}\t?list rdf:rest* ?listRest .\n` +
            `${b}\t?listRest rdf:first ?head ;\n` +
            `${b}\t\trdf:rest ?tail .\n`;

        q+= c;
        q+= '}';

        return this.appendPrefixesToQuery(q);
    }


    listCalculations(input?: GetCalc) {
        var namedGraphs = this.namedGraphs ? this.namedGraphs.map(uri => this.cleanURI(uri)) : null;

        var queryType = this.queryType;
        if(input){
            if(input.queryType) queryType = input.queryType;
        }

        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';

        var q: string = '';

        if(queryType == 'construct'){
            q+= '\nCONSTRUCT {\n' +
                '\t?calculationURI a ?calcClasses ;\n';
            if(!this.mainGraph) q+= '\t\tsd:namedGraph ?g ;\n';
            
            q+= '\t\topm:inferredProperty ?inferredProperty ;\n' +
                '\t\topm:expression ?expression ;\n' +
                '\t\tprov:generatedAtTime ?timestamp ;\n' +
                '\t\trdfs:label ?label ;\n' +
                '\t\trdfs:comment ?comment .\n' +
                '}\n';
        }else{
            q+= '\nSELECT ?calculationURI ?label ?comment\n';
        }

        if(namedGraphs) namedGraphs.forEach(uri => q+= `FROM NAMED ${uri}\n`);

        q+= 'WHERE {\n';
        q+= a;
        q+= `${b}\t?calculationURI opm:inferredProperty ?inferredProperty ;\n` +
            `${b}\t\tprov:generatedAtTime ?timestamp .\n` +
            `${b}\tOPTIONAL{ ?calculationURI opm:expression ?expression . }\n` +
            `${b}\tOPTIONAL{ ?calculationURI a ?calcClasses . }\n` +
            `${b}\tOPTIONAL{ ?calculationURI rdfs:label ?label . }\n` +
            `${b}\tOPTIONAL{ ?calculationURI rdfs:comment ?comment . }\n`;
        q+= c;
        q+= '}';

        return this.appendPrefixesToQuery(q);
    }

    // Insert derived values matching some calculation where they do not already exist
    // NB! it could be useful to be able to apply a restriction that should be fulfilled. Eg. ?foi a bot:Element
    postCalcExtended(input: PostPutCalc) {
        
        // Get global variables
        var host = this.host;
        var namedGraphs = this.namedGraphs ? this.namedGraphs.map(uri => this.cleanURI(uri)) : null;
        var iGraph = this.cleanURI(this.iGraph);   // New triples should be inferred in the I-Graph

        //Define variables
        var label = this.cleanLiteral(input.label);
        var comment = this.cleanLiteral(input.comment);
        var expression = input.expression;
        var argumentPaths = input.argumentPaths;
        var argumentVars: string[] = [];
        var propertyURI = this.cleanURI(input.inferredProperty);
        
        //Optional
        var foiURI = this.cleanURI(input.foiURI); //If only for a specific FoI
        var queryType = input.queryType ? input.queryType : this.queryType;     // Get default if not defined
        var userURI = this.cleanURI(input.userURI);
        var path = input.path ? this.cleanPath(input.path) : undefined;
        var pathString = input.path ? this.cleanLiteral(input.path) : undefined;

        //Clean argument paths and retrieve argument variables
        argumentVars = this.cleanArgPaths(argumentPaths).vars;
        argumentPaths = this.cleanArgPaths(argumentPaths).paths;
        var expressionVars = this.uniqueVarsInString(expression);

        // Validate
        if(!label) return new Error('Please specify a label');
        if(!expression) return new Error('Specify an expression');
        if(!argumentPaths) return new Error(`Specify ${expressionVars.length} argument path(s)`);
        if(expressionVars.length != argumentPaths.length) return new Error('There is a mismatch between number of arguments used in the expression and the number of argument paths given');
        // NB! In below slice prevents the sort() from changing the original order
        if(!_.isEqual(expressionVars.sort(), argumentVars.slice().sort())) return new Error(`There is a mismatch between the arguments given in the expression (${expressionVars.sort()}) and the arguments given in the paths (${argumentVars.sort()})`);

        var q: string = '';

        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';
                        
        if(queryType == 'construct') q+= '\nCONSTRUCT {\n';
        if(queryType == 'insert') {
            q+= '\nINSERT {\n';
            if(!this.mainGraph) q+= `\tGRAPH ${iGraph} {\n`;
        }

        q+= `${b}\t?foi ?inferredProperty ?propertyURI .\n` +
            `${b}\t?propertyURI a opm:Property ;\n` +
            `${b}\t\topm:hasPropertyState ?stateURI .\n` +
            `${b}\t?stateURI a opm:CurrentPropertyState , opm:Derived , ?reliability ;\n` +
            `${b}\t\tschema:value ?res ;\n` +
            `${b}\t\tprov:generatedAtTime ?now ;\n` +
            `${b}\t\tprov:wasDerivedFrom `;

        for(var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `?state${_i}`
            q+= (argumentPaths.length == _i) ? ' ;\n' : ' , ';
        }

        q+= `${b}\t\tprov:wasAttributedTo ?calculationURI .\n` +
            `${b}\t?calculationURI a opm:Calculation ;\n` +
            `${b}\t\trdfs:label ${label} ;\n`;
        
        if(path) q+= `${b}\t\topm:pathRestriction ${pathString} ;\n`;
        if(foiURI) q+= `${b}\t\topm:foiRestriction ${foiURI} ;\n`;
        if(comment) q+= `${b}\t\trdfs:comment ${comment} ;\n`;
        if(userURI) q+= `${b}\t\tprov:wasAttributedTo ${userURI} ;\n`;

        q+= `${b}\t\tprov:generatedAtTime ?now ;\n` +
            `${b}\t\topm:inferredProperty ?inferredProperty ;\n` +
            `${b}\t\topm:expression "${expression}" ;\n` +
            `${b}\t\topm:argumentPaths ?bn0 .\n`;

        _.each(argumentPaths, (obj, i) => {
            q+= `${b}\t\t?bn${i} `;
            q+= `rdf:first "${argumentPaths[i]}" ;\n`;
            q+= `${b}\t\t\trdf:rest `;
            q+= (argumentPaths.length == Number(i)+1) ? 'rdf:nil .\n' : `?bn${i+1} .\n`;
        });

        if(!this.mainGraph) q+= c;
        q+= `}\n`;

        if(queryType == 'construct' && namedGraphs) namedGraphs.forEach(uri => q+= `FROM NAMED ${uri}\n`);
        if(queryType == 'insert' && namedGraphs) namedGraphs.forEach(uri => q+= `USING NAMED ${uri}\n`);

        // Get data
        q+= `WHERE {\n`;
        q+= a;

        if(foiURI) q+= `${b}\tBIND(${foiURI} AS ?foi)\n`;

        q+= `${b}\tBIND(${propertyURI} AS ?inferredProperty)\n\n`;

        q+= `${b}\t# MAKE NODES FOR CALCULATION LIST\n`;

        _.each(argumentPaths, (obj, i) => {
            q+= `${b}\tBIND(URI(CONCAT("${host}", "bn/", STRUUID())) AS ?bn${i})\n`;
        });
        q+= '\n';

        if(path) {
            q+= `${b}\t# PATH TO BE MATCHED\n` +
                `${b}\t${path}\n\n`
        }

        // Retrieve data
        for (var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `${b}\t# GET ARGUMENT ${_i} DATA\n` +
                `${b}\t${argumentPaths[i]}_ .\n` +
                `${b}\t${argumentVars[i]}_ opm:hasPropertyState ?state${_i} .\n` +
                `${b}\t?state${_i} a opm:CurrentPropertyState ;\n` +
                `${b}\t\tschema:value ${argumentVars[i]} .\n` +
                `${b}\t# INHERIT CLASS OPM:ASSUMED OR OPM:DELETED\n` +
                `${b}\tOPTIONAL {\n` +
                `${b}\t\t?state${_i} a ?reliability .\n` +
                `${b}\t\tFILTER( ?reliability = opm:Assumed || ?reliability = opm:Deleted )\n` +
                `${b}\t}\n\n`;
        }

        // No previous calculations must exist
        q+= `${b}\t# DO NOT APPEND IF PROPERTY ALREADY DEFINED\n` +
            `${b}\tMINUS { ?foi ?inferredProperty ?prop }\n\n`;

        q+= `${b}\t# PERFORM CALCULATION\n` +
            `${b}\tBIND((${expression}) AS ?res)\n\n` +

            `${b}\t# CREATE STATE AND PROPERTY URIs\n` +
            `${b}\tBIND(URI(CONCAT("${host}", "states/", STRUUID())) AS ?stateURI)\n` +
            `${b}\tBIND(URI(CONCAT("${host}", "properties/", STRUUID())) AS ?propertyURI)\n\n` +

            `${b}\t# MAKE A URI FOR THE CALCULATION\n` +
            `${b}\t{ SELECT ?calculationURI WHERE {\n` +
            `${b}\t\t# MATCH ONE OF THE ARGUMENT PATHS\n` +
            `${b}\t\t${argumentPaths[i]}\n` +
            `${b}\t\tBIND(URI(CONCAT("${host}", "calculations/", STRUUID())) AS ?calculationURI)\n` +
            `${b}\t}LIMIT 1}\n\n` +

            `${b}\t# GET CURRENT TIME\n` +
            `${b}\tBIND(now() AS ?now)\n`;
        
        if(!this.mainGraph) q+= c;

        q+= '}';

        return this.appendPrefixesToQuery(q);
    }
    
    // Insert derived values matching some calculation where they do not already exist
    // NB! it could be useful to be able to apply a restriction that should be fulfilled. Fx ?foi a bot:Element
    postCalc(input: PostPutCalc) {

        // Get global variables
        var host = this.host;
        var namedGraphs = this.namedGraphs ? this.namedGraphs.map(uri => this.cleanURI(uri)) : null;
        var mainGraph = this.mainGraph;
        var iGraph = this.cleanURI(this.iGraph);   // Derived triples should be inferred in the I-Graph

        //Define variables
        var calculationURI = this.cleanURI(input.calculationURI);
        var expression = input.expression;
        var argumentPaths = input.argumentPaths;
        var argumentVars: string[] = [];
        var propertyURI = this.cleanURI(input.inferredProperty);

        // Validate arguments
        if(!expression) return new Error('Specify an expression');
        if(!calculationURI) return new Error('Specify a calculation URI');
        if(!argumentPaths) return new Error(`Specify ${expressionVars.length} argument path(s)`);

        //Extract calculation type from the expression
        var type;
        var validTypes = ["sum", "count", "min", "max", "avg"];
        var typeMatches = validTypes.filter(w => {
            return expression.toLowerCase().indexOf(w) != -1;
        });
        if(typeMatches.length > 1) return new Error('Expression cannot contain both ' + typeMatches.join(' and '));
        if(typeMatches.length == 1) {
            type = typeMatches[0];
            // Remove sum(?var), avg(?var) etc. from expression
            var expSplit = expression.split(type);
            expSplit[1] = expSplit[1].replace('(', '').replace(')', '');
            expression = expSplit.join('');
        }
        else type = "regular";
        
        // Optional
        var foiURI = this.cleanURI(input.foiURI); //If only for a specific FoI
        var queryType = input.queryType ? input.queryType : this.queryType;     // Get default if not defined
        var path = input.path ? this.cleanPath(input.path) : undefined;

        // Clean argument paths and retrieve argument variables
        argumentVars = this.cleanArgPaths(argumentPaths).vars;
        argumentPaths = this.cleanArgPaths(argumentPaths).paths;
        var expressionVars = this.uniqueVarsInString(expression);

        // More validation
        if(expressionVars.length != argumentPaths.length) return new Error('There is a mismatch between number of arguments used in the expression and the number of argument paths given');
        // NB! In below, slice prevents the sort() from changing the original order
        if(!_.isEqual(expressionVars.sort(), argumentVars.slice().sort())) return new Error(`There is a mismatch between the arguments given in the expression (${expressionVars.sort()}) and the arguments given in the paths (${argumentVars.sort()})`);

        var q: string = '';

        // define a few variables to use with named graphs
        var a = mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = mainGraph ? '' : '\t';
        var c = mainGraph ? '' : '\t}\n';
        var d = queryType != 'insert' ? '' : '\t';

        if(queryType == 'count'){
            q+= 'SELECT (COUNT(?foi) AS ?count)\n';
        }else{
                      
            if(queryType == 'construct') q+= '\nCONSTRUCT {\n';
            if(queryType == 'insert') {
                q+= '\nINSERT {\n';
                if(!mainGraph) q+= `\tGRAPH ${iGraph} {\n`;
            }

            q+= `${d}\t?foi ?inferredProperty ?propertyURI .\n` +
                `${d}\t?propertyURI a opm:Property ;\n` +
                `${d}\t\topm:hasPropertyState ?stateURI .\n` +
                `${d}\t?stateURI a opm:CurrentPropertyState , opm:Derived , ?reliability ;\n` +
                `${d}\t\tschema:value ?res ;\n` +
                `${d}\t\tprov:generatedAtTime ?now ;\n`;
            
            if(calculationURI) q+= `${d}\t\tprov:wasAttributedTo ${calculationURI} ;\n`;
                
            q+= `${d}\t\tprov:wasDerivedFrom `;

            for(var i in argumentPaths){
                var _i = Number(i)+1;
                q+= `?state${_i}`
                q+= (argumentPaths.length == _i) ? ' .\n' : ' , ';
            }

            if(!this.mainGraph && queryType == 'insert') q+= c;

            q+= `}\n`;
        }

        if(queryType == 'construct' && namedGraphs) namedGraphs.forEach(uri => q+= `FROM NAMED ${uri}\n`);
        if(queryType == 'insert' && namedGraphs) namedGraphs.forEach(uri => q+= `USING NAMED ${uri}\n`);

        // Get data
        q+= `WHERE {\n`;

        if(foiURI) q+= `\tBIND(${foiURI} AS ?foi)\n`;

        q+= `\tBIND(${propertyURI} AS ?inferredProperty)\n\n`;

        if(path) {
            q+= `\t# PATH TO BE MATCHED\n`;
            q+= a;
            q+= `${b}\t${path}\n`;
            q+= c+'\n';
        }

        if(type == "regular"){
            // Retrieve data
            for (var i in argumentPaths){
                var _i = Number(i)+1;
                q+= `\t# GET ARGUMENT ${_i} DATA\n`;

                // The data is potentially stored in different graphs
                if(!mainGraph) q+= `\tGRAPH ?g${_i} {\n`;

                q+= `${b}\t${argumentPaths[i]}_ .\n` +
                    `${b}\t${argumentVars[i]}_ opm:hasPropertyState ?state${_i} .\n` +
                    `${b}\t?state${_i} a opm:CurrentPropertyState ;\n` +
                    `${b}\t\tschema:value ${argumentVars[i]} .\n` +
                    `${b}\t# INHERIT CLASS OPM:ASSUMED OR OPM:DELETED\n` +
                    `${b}\tOPTIONAL {\n` +
                    `${b}\t\t?state${_i} a ?reliability .\n` +
                    `${b}\t\tFILTER( ?reliability = opm:Assumed || ?reliability = opm:Deleted )\n` +
                    `${b}\t}\n\n`;
                q+= c;
            }
        }else{
            q+= `\t# GET THE MOST RECENT STATES OF THE ARGUMENTS\n`;

            // The data is potentially stored in different graphs
            if(!mainGraph) q+= `\tGRAPH ?g {\n`;

            q+= `${b}\t{ SELECT ?foi (?state AS ?state1) WHERE {\n` +
                `${b}\t\t${argumentPaths[0]}_ .\n` +
                `${b}\t\t${argumentVars[0]}_ opm:hasPropertyState ?state .\n` +
                `${b}\t\t?state a opm:CurrentPropertyState\n` +
                `${b}\t}}\n\n`;

            q+= `${b}\t# CALCULATE THE ${type.toUpperCase()}\n`;

            q+= `${b}\t{ SELECT ?foi (${type.toUpperCase()}(?res_) AS ${argumentVars[0]})\n` +
                `${b}\t\t(URI(CONCAT("${host}", "states/", STRUUID())) AS ?stateURI)\n` +
                `${b}\t\t(URI(CONCAT("${host}", "properties/", STRUUID())) AS ?propertyURI)\n` +
                `${b}\t\t(now() AS ?now)\n` +
                `${b}\t  WHERE {\n` +
                `${b}\t\t${argumentPaths[0]}_ .\n` +
                `${b}\t\t${argumentVars[0]}_ opm:hasPropertyState ?state1 .\n` +
                `${b}\t\t?state1 schema:value ${argumentVars[0]}__ .\n` +
                `${b}\t\tBIND(IF(isnumeric(${argumentVars[0]}__), ${argumentVars[0]}__ , xsd:decimal(strbefore(xsd:string(${argumentVars[0]}__), ' '))) AS ?res_)\n` +
                `${b}\t  } GROUP BY ?foi\n` +
                `${b}\t}\n\n`;

            q+= `${b}\t# INHERIT CLASS OPM:ASSUMED OR OPM:DELETED\n` +
                `${b}\tOPTIONAL {\n` +
                `${b}\t\t?state1 a ?reliability .\n` +
                `${b}\t\tFILTER( ?reliability = opm:Assumed || ?reliability = opm:Deleted )\n` +
                `${b}\t}\n\n`;

            q+= c;
    
        }

        // No previous calculations must exist
        q+= `\t# DO NOT APPEND IF PROPERTY ALREADY DEFINED\n`;
        q+= `\tMINUS { `;
        if(!mainGraph) q+= `GRAPH ${iGraph} { `;
        q+=`?foi ?inferredProperty ?prop }`;
        q+= mainGraph ? '\n\n' : ' }\n\n';

        if(type == "regular"){
            q+= `\t# PERFORM CALCULATION\n` +
                `\tBIND((${expression}) AS ?res)\n\n` +

                `\t# CREATE STATE AND PROPERTY URIs\n` +
                `\tBIND(URI(CONCAT("${host}", "states/", STRUUID())) AS ?stateURI)\n` +
                `\tBIND(URI(CONCAT("${host}", "properties/", STRUUID())) AS ?propertyURI)\n\n` +

                `\t# GET CURRENT TIME\n` +
                `\tBIND(now() AS ?now)\n`;
        }else if(expression){
            q+= `\t# APPLY EXPRESSION\n` +
            `\tBIND((${expression}) AS ?res)\n`;
        }else{
            q+= `\t# APPLY EXPRESSION\n` +
            `\tBIND((${argumentVars[0]}) AS ?res)\n`;
        }

        q+= '}';

        return this.appendPrefixesToQuery(q);
    }

    putCalc(input){

        // Get global variables
        var host = this.host;
        var mainGraph = this.mainGraph;
        var namedGraphs = this.namedGraphs ? this.namedGraphs.map(uri => this.cleanURI(uri)) : null;
        var iGraph = this.cleanURI(this.iGraph);
        
        // Define variables
        var calculationURI = this.cleanURI(input.calculationURI);
        var expression = input.expression;
        var argumentPaths = input.argumentPaths;
        var argumentVars: string[] = [];
        var propertyURI = this.cleanURI(input.inferredProperty);

        //Extract calculation type from the expression
        var type;
        var validTypes = ["sum", "count", "min", "max", "avg"];
        var typeMatches = validTypes.filter(w => {
            return expression.toLowerCase().indexOf(w) != -1;
        });
        if(typeMatches.length > 1) return new Error('Expression cannot contain both ' + typeMatches.join(' and '));
        if(typeMatches.length == 1) {
            type = typeMatches[0];
            // Remove sum(?var), avg(?var) etc. from expression
            var expSplit = expression.split(type);
            expSplit[1] = expSplit[1].replace('(', '').replace(')', '');
            expression = expSplit.join('');
        }
        else type = "regular";

        // Optional
        var foiURI = this.cleanURI(input.foiURI); //If only for a specific FoI
        var queryType = input.queryType ? input.queryType : this.queryType;     // Get default if not defined

        // Clean argument paths and retrieve argument variables
        argumentVars = this.cleanArgPaths(argumentPaths).vars;
        argumentPaths = this.cleanArgPaths(argumentPaths).paths;
        var expressionVars = this.uniqueVarsInString(expression);

        // Validate arguments
        if(!expression) return new Error('Specify an expression');
        if(!calculationURI) return new Error('Specify a calculation URI');
        if(!argumentPaths) return new Error(`Specify ${expressionVars.length} argument path(s)`);
        if(expressionVars.length != argumentPaths.length) return new Error('There is a mismatch between number of arguments used in the expression and the number of argument paths given');
        
        // NB! In below slice prevents the sort() from changing the original order
        if(!_.isEqual(expressionVars.sort(), argumentVars.slice().sort())) return new Error(`There is a mismatch between the arguments given in the expression (${expressionVars.sort()}) and the arguments given in the paths (${argumentVars.sort()})`);

        var q: string = '';

        // define a few variables to use with named graphs
        var a = mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = mainGraph ? '' : '\t';
        var c = mainGraph ? '' : '\t}\n';

        if(queryType == 'construct') q+= '\nCONSTRUCT {\n';
        if(queryType == 'insert') {
            // FIRST DELETE CURRENT STATE CLASS FROM PREVIOUS STATE
            q+= '\nDELETE {\n';
            if(!mainGraph) q+= `\tGRAPH ${iGraph} {\n`;
            q+= `${b}\t?previousState a opm:CurrentPropertyState .\n`;
            if(!mainGraph) q+= c;
            q+= '}\n' +
                'INSERT {\n';
            if(!mainGraph) q+= `\tGRAPH ${iGraph} {\n`;
            q+= `${b}\t?previousState a opm:PropertyState .\n`;
        }

        q+= `${b}\t?propertyURI a opm:Property ;\n` +
            `${b}\t\topm:hasPropertyState ?stateURI .\n` +
            `${b}\t?stateURI a opm:CurrentPropertyState , opm:Derived , ?reliability ;\n` +
            `${b}\t\tschema:value ?res ;\n` +
            `${b}\t\tprov:generatedAtTime ?now ;\n` +
            `${b}\t\tprov:wasAttributedTo ${calculationURI} ;\n` +
            `${b}\t\tprov:wasDerivedFrom `;

        for(var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `?newState${_i}`
            q+= (argumentPaths.length == _i) ? ' .\n' : ' , ';
        }
        if(!this.mainGraph && queryType == 'insert') q+= c;

        q+= `}\n`;
        
        if(queryType == 'construct' && namedGraphs) namedGraphs.forEach(uri => q+= `FROM NAMED ${uri}\n`);
        if(queryType == 'insert' && namedGraphs) namedGraphs.forEach(uri => q+= `USING NAMED ${uri}\n`);

        // Get data
        q+= `WHERE {\n`;

        //BIND to FoIURI if one is given
        if(foiURI) q+= `\tBIND(${foiURI} AS ?foi)\n`;
            
        q+= `\tBIND(${propertyURI} AS ?inferredProperty)\n\n`;

        q+= `\t# GET LATEST STATE\n`;
        if(!mainGraph) q+= `\tGRAPH ${iGraph} {\n`;
            
        q+= `${b}\t?foi ?inferredProperty ?propertyURI .\n` +
            `${b}\t?propertyURI opm:hasPropertyState ?previousState .\n` +
            `${b}\t?previousState a opm:CurrentPropertyState ;\n` +
            `${b}\t\tschema:value ?previousValue .\n\n`;
        
        if(type == "regular"){

            q+= mainGraph ? `\n` : `\t}\n`;

            // Retrieve data
            for (var i in argumentPaths){
                var _i = Number(i)+1;
                q+= `\t# GET ARGUMENT ${_i} DATA\n`;

                if(!mainGraph) q+= `\tGRAPH ?g${_i} {\n`;

                q+= `${b}\t${argumentPaths[i]}_ .\n` +
                    `${b}\t${argumentVars[i]}_ opm:hasPropertyState ?newState${_i} .\n` +
                    `${b}\t?newState${_i} a opm:CurrentPropertyState ;\n` +
                    `${b}\t\tschema:value ${argumentVars[i]} .\n` +
                    `${b}\t# INHERIT CLASS OPM:ASSUMED OR OPM:DELETED\n` +
                    `${b}\tOPTIONAL {\n` +
                    `${b}\t\t?newState${_i} a ?reliability .\n` +
                    `${b}\t\tFILTER( ?reliability = opm:Assumed || ?reliability = opm:Deleted )\n` +
                    `${b}\t}\n`;

                q+= mainGraph ? `\n` : `\t}\n`;
            }
        }else{

            q+= `${b}\t# CALCULATE THE ${type.toUpperCase()}\n`;

            var resVar = expression ? argumentVars[0] : '?res';

            q+= `${b}\t{ SELECT ?foi (${type.toUpperCase()}(?res_) AS ${resVar})\n` +
                `${b}\t\t(URI(CONCAT("${host}", "states/", STRUUID())) AS ?stateURI)\n` +
                `${b}\t\t(now() AS ?now)\n` +
                `${b}\t  WHERE {\n` +
                `${b}\t\t${argumentPaths[0]}_ .\n` +
                `${b}\t\t${argumentVars[0]}_ opm:hasPropertyState ?state1 .\n` +
                `${b}\t\t?state1 schema:value ${argumentVars[0]}__ .\n` +
                `${b}\t\tBIND(IF(isnumeric(${argumentVars[0]}__), ${argumentVars[0]}__ , xsd:decimal(strbefore(xsd:string(${argumentVars[0]}__), ' '))) AS ?res_)\n` +
                `${b}\t  } GROUP BY ?foi\n` +
                `${b}\t}\n\n`;

            q+= mainGraph ? `\n` : `\t}\n`;
        }
        if(expression){
            q+= `\t# APPLY EXPRESSION\n` +
            `\tBIND((${expression}) AS ?res)\n\n`;
        }
        
        q+= `\t# THE NEW RESULT MUST BE DIFFERENT FROM THE PREVIOUS\n` +
            `\tFILTER(xsd:string(?res) != xsd:string(?previousValue))\n\n`;

        if(type == "regular"){
            q+= `\t# CREATE STATE URIs\n` +
                `\tBIND(URI(CONCAT("${host}", "states/", STRUUID())) AS ?stateURI)\n` +
                `\t# GET CURRENT TIME\n` +
                `\tBIND(now() AS ?now)\n`;
        }

        q+= '}';

        return this.appendPrefixesToQuery(q);
    }

    putByCalcURI(calculationURI, queryType?): string{
        
        // Get global variables
        var host = this.host;
        var namedGraphs = this.namedGraphs ? this.namedGraphs.map(uri => this.cleanURI(uri)) : null;
        var iGraph = this.cleanURI(this.iGraph);   // New triples should be inferred in the I-Graph
        
        // Define variables
        var calculationURI = this.cleanURI(calculationURI);

        // Optional
        var queryType = queryType ? queryType : this.queryType;     // Get default if not defined

        var q: string = '';

        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';

        if(queryType == 'count'){
            q+= 'SELECT (COUNT(?foi) AS ?count)\n';
        }else{

            if(queryType == 'construct') q+= '\nCONSTRUCT {\n';
            if(queryType == 'insert') {
                // FIRST DELETE CURRENT STATE CLASS FROM PREVIOUS STATE
                q+= '\nDELETE {\n';
                if(!this.mainGraph) q+= `\tGRAPH ${iGraph} {\n`;
                q+= `${b}\t?previousState a opm:CurrentPropertyState .\n`;
                if(!this.mainGraph) q+= c;
                q+= '}\n' +
                    'INSERT {\n';
                if(!this.mainGraph) q+= `\tGRAPH ${iGraph} {\n`;
                q+= `${b}\t?previousState a opm:PropertyState .\n`;
            }

            q+= `${b}\t?propertyURI a opm:Property ;\n` +
                `${b}\t\topm:hasPropertyState ?stateURI .\n` +
                `${b}\t?stateURI a opm:CurrentPropertyState , opm:Derived , ?reliability ;\n` +
                `${b}\t\tschema:value ?res ;\n` +
                `${b}\t\tprov:generatedAtTime ?now ;\n` +
                `${b}\t\tprov:wasAttributedTo ${calculationURI} ;\n` +
                `${b}\t\tprov:wasDerivedFrom ?states .`;

            if(!this.mainGraph) q+= c;
            q+= '}\n';
        }

        if(queryType == 'construct' && namedGraphs) namedGraphs.forEach(uri => q+= `FROM NAMED ${uri}\n`);
        if(queryType == 'insert' && namedGraphs) namedGraphs.forEach(uri => q+= `USING NAMED ${uri}\n`);

        // Get data
        q+= `WHERE {\n`;

        if(!this.mainGraph) q+= a;
            
        q+= `${b}\tBIND(${calculationURI} AS ?calculationURI)\n\n`;

        q+= `${b}\t?calculationURI ?p ?o .` +

            `${b}\t# CREATE STATE URIs\n` +
            `${b}\tBIND(URI(CONCAT("${host}", "states/", STRUUID())) AS ?stateURI)\n` +
            `${b}\t# GET CURRENT TIME\n` +
            `${b}\tBIND(now() AS ?now)\n`;

        if(!this.mainGraph) q+= c;            

        q+= '}';

        return this.appendPrefixesToQuery(q);
    }


    public getOutdated(foiURI?, queryType?) {

        // Get global variables
        var mainGraph = this.mainGraph;
        var namedGraphs = this.namedGraphs ? this.namedGraphs.map(uri => this.cleanURI(uri)) : null;

        // Process variables
        foiURI = this.cleanURI(foiURI);
        queryType = queryType ? queryType : this.queryType;     // Get default if not defined

        var q = '';

        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : `\tGRAPH ?g {\n`;
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';
                      
        if(queryType == 'construct') {
            q+= '\nCONSTRUCT {\n' +
                `\t?foi ?hasProp ?prop .\n` +
                `\t?prop opm:hasPropertyState ?state .\n` +
                `\t?state a opm:CurrentPropertyState , opm:Derived ;\n` +
                `\t\tprov:wasAttributedTo ?calculationURI ;\n` +
                `\t\tprov:wasDerivedFrom ?derivedFrom .\n\n` +
                `}\n`;

        }
        if(queryType == 'select') {
            q+= 'SELECT *\n';
        }

        if(namedGraphs) namedGraphs.forEach(uri => q+= `FROM NAMED ${uri}\n`);

        q+= `WHERE {\n`;
        q+= a; // handle named graph

        if(foiURI) q+= `\tBIND(${foiURI} AS ?foi)\n`;

        q+= `${b}\t?foi ?hasProp ?prop .\n` +
            `${b}\t?prop opm:hasPropertyState ?state .\n` +
            `${b}\t?state a opm:CurrentPropertyState , opm:Derived ;\n` +
            `${b}\t\tprov:wasAttributedTo ?calculationURI ;\n` +
            `${b}\t\tprov:wasDerivedFrom ?derivedFrom .\n\n`;
        q+= c;

        q+= `\t# RETURN ONLY IF AN ARGUMENT HAS CHANGED\n` +
            `\tMINUS { `;
            if(!mainGraph) q+= `GRAPH ?g { `;
            q+=`?derivedFrom a opm:CurrentPropertyState }`;
            q+= mainGraph ? '\n' : ' }\n';
        q+= `}`
            
        if(queryType == 'select') q+= `GROUP BY ?foi\n`;

        return this.appendPrefixesToQuery(q);
                          
    }

    public getSubscribers(input) {

        // Get global variables
        var mainGraph = this.mainGraph;
        var namedGraphs = this.namedGraphs ? this.namedGraphs.map(uri => this.cleanURI(uri)) : null;

        // Optional variables
        var propertyURI = this.cleanURI(input.propertyURI);
        var foiURI = this.cleanURI(input.foiURI);
        var property = this.cleanURI(input.property);

        if(!propertyURI){
            if(foiURI && !property) return new Error('Please specify a property');
            if(!foiURI && property) return new Error('Please specify a foiURI');
            if(!foiURI && !property) return new Error('Please specify a propertyURI');
        }

        var q = '';

        var a = mainGraph ? '' : '\t';

        q+= 'CONSTRUCT {\n' +
            '\t?propertyURI opm:hasSubscriber ?depProp .\n' +
            '}\n';

        if(namedGraphs) namedGraphs.forEach(uri => q+= `FROM NAMED ${uri}\n`);

        q+= 'WHERE {\n';
        if(foiURI) q+= `\tBIND(${foiURI} AS ?foiURI)\n`;
        if(propertyURI) q+= `\tBIND(${propertyURI} AS ?propertyURI)\n`;
        if(property) q+= `\tBIND(${property} AS ?property)\n`;

        q+= `\n\t# FIND DEPENDENT PROPERTIES\n`
        if(!mainGraph) q+= '\tGRAPH ?g {\n';

        if(property) q+= `${a}\t?foiURI ?property ?propertyURI .\n`;

        q+= `${a}\t?propertyURI opm:hasPropertyState ?propState .\n` +
            `${a}\t?foiURI ?property ?propertyURI .\n`;
        
        if(!mainGraph) q+= '\t}\n';

        if(!mainGraph) q+= '\tGRAPH ?g2 {\n';
        
        q+= `${a}\t?depProp opm:hasPropertyState ?depState .\n` +
            `${a}\t?depState prov:wasDerivedFrom ?propState .\n`;

        if(!mainGraph) q+= '\t}\n';

        q+= `}\n`;

        return this.appendPrefixesToQuery(q);
    }

}
import * as _ from "lodash";
import * as _s from "underscore.string";
import { BaseModel } from "./base";
import { Prefix, Literal, Base } from "./base";

interface GetCalc {
    calculationURI?: string; //to return results only for a specific calculation
    queryType?: string;
    label?: string;
}

export interface PostCalcData extends Base {
    label?: string;
    foiRestriction?: string;
    pathRestriction?: string;
    hostURI: string; //Needed as there is nothing else to extract it from
    expression: string;
    argumentPaths: string[];
    inferredProperty: InferredProperty;
}

export interface PostPutCalc extends Base {
    calculationURI?: string;
    expression: string;
    argumentPaths: string[];
    inferredProperty: string;
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
        if(!expression) return new Error('Please specify an expression');
        if(!argumentPaths) return new Error(`Specify ${expressionVars.length} argument path(s)`);
        if(expressionVars.length != argumentPaths.length) return new Error('There is a mismatch between number of arguments used in the expression and the number of argument paths given');
        if(!_.isEqual(expressionVars.sort(), argumentVars.sort())) return new Error(`There is a mismatch between the arguments given in the expression (${expressionVars.sort()}) and the arguments given in the paths (${argumentVars.sort()})`);

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
        
        if(queryType == 'construct') q+= '\nCONSTRUCT {\n';
        if(queryType == 'insert') {
            q+= '\nINSERT {\n';
            if(!this.mainGraph) q+= `\tGRAPH <${host}> {\n`;
        }

        q+= `${b}\t?calculationURI a opm:Calculation ;\n` +
            `${b}\t\trdfs:label ${label} ;\n`;
        
        if(comment) q+= `${b}\t\trdfs:comment ${comment} ;\n`;
        if(userURI) q+= `${b}\t\tprov:wasAttributedTo ${userURI} ;\n`;
        if(foiRestriction) q+= `${b}\t\topm:foiRestriction ${foiRestriction} ;\n`;
        if(pathRestriction) q+= `${b}\t\topm:pathRestriction ${pathRestriction} ;\n`;

        q+= `${b}\t\tprov:generatedAtTime ?now ;\n` +
            `${b}\t\topm:inferredProperty ${propertyURI} ;\n` +
            `${b}\t\topm:expression ${expression} .\n`;
        
        /**
         * THE FOLLOWING DOESN'T WORK WITH STARDOG
         */
        // q+= '\t\topm:arguments ( ';

        // Add arguments to arguments list
        // for(var i in argumentPaths){
        //     q+= `argumentPaths[i]`;
        //     q+= (Number(i) == argumentPaths.length-1) ? ' ) .\n' : ' ';
        // }

        /**
         * INSTEAD WE WILL HAVE TO NEST THE ARGUMENT LIST
         */
        q+= `${b}\t?calculationURI opm:argumentPaths [\n`;
        _.each(argumentPaths, (obj, i) => {
            q+= `${b}\t`;
            q+= _s.repeat("  ", i+1); //two spaces
            q+= `rdf:first "${argumentPaths[i]}" ; rdf:rest `;
            q+= (argumentPaths.length == Number(i)+1) ? 'rdf:nil\n' : '[\n';
        });
        _.each(argumentPaths, (obj, i) => {
            if(Number(i) < argumentPaths.length-1){
                q+= `${b}\t`;
                q+= _s.repeat("  ", argumentPaths.length-(Number(i)+1));
                q+= `${b}]\n`;
            }
        });
        q+= `${b}\t] .\n`;

        if(!this.mainGraph) q+= c;
        q+= `}\n`;

        q+= 'WHERE {\n';
        q+= a;
        q+= `${b}\t# CREATE CALCULATION URI\n` +
            `${b}\tBIND(URI(CONCAT(STR("${host}"), "calculation_", STRUUID())) AS ?calculationURI)\n\n` +
            `${b}\t# GET CURRENT TIME\n` +
            `${b}\tBIND(now() AS ?now)\n`;
        
        q+= c;
        q+= '}';

        return this.appendPrefixesToQuery(q);
    }


    getCalcData(input: GetCalc): string{
        var queryType = this.queryType;
        if(input){
            if(input.calculationURI) var calculationURI = this.cleanURI(input.calculationURI);
            if(input.label) var label = this.cleanLiteral(input.label);
            if(input.queryType) queryType = input.queryType;
        }

        var q: string = '';

        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';

        if(queryType == 'construct'){
            q+= 'CONSTRUCT {\n' +
                '\t?calculationURI ?key ?val ;\n';
            
            if(!this.mainGraph) q+= '\t\tsd:namedGraph ?g ;\n';

            q+= '\t\topm:argumentPaths ?list .\n' +
                '\t?listRest rdf:first ?head ;\n' +
                '\t\trdf:rest ?tail .\n' +
                '}\n';
        }else{
            q+= 'SELECT ?calculationURI ?label\n';
        }

        q+= 'WHERE {\n';
        q+= a;

        if(calculationURI) q+= `${b}\tBIND(${calculationURI} AS ?calculationURI)\n`;
        if(label) q+= `${b}\tBIND(${label} AS ?label)\n`;

        q+= `${b}\t?calculationURI ?key ?val ;\n`;

        if(label) q+= `${b}\t\trdfs:label ?label ;\n`;

        q+= `${b}\t\topm:argumentPaths ?list .\n` +
            `${b}\t?list rdf:rest* ?listRest .\n` +
            `${b}\t?listRest rdf:first ?head ;\n` +
            `${b}\t\trdf:rest ?tail .\n`;

        if(!label) q+= `${b}\tOPTIONAL{ ?calculationURI rdfs:label ?label . }\n`;

        q+= c;
        q+= '}';

        return this.appendPrefixesToQuery(q);
    }


    listCalculations(input?: GetCalc) {
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

        q+= 'WHERE {\n';
        q+= a;
        q+= `${b}\t?calculationURI opm:inferredProperty ?inferredProperty ;\n` +
            `${b}\t\tprov:generatedAtTime ?timestamp ;\n` +
            `${b}\t\topm:expression ?expression ;\n` +
            `${b}\tOPTIONAL{ ?arg opm:targetPath ?argTP . }\n` +
            `${b}\tOPTIONAL{ ?calculationURI a ?calcClasses . }\n` +
            `${b}\tOPTIONAL{ ?calculationURI rdfs:label ?label . }\n` +
            `${b}\tOPTIONAL{ ?calculationURI rdfs:comment ?comment . }\n`;
        q+= c;
        q+= '}';

        return this.appendPrefixesToQuery(q);
    }

    // // Insert derived values matching some calculation where they do not already exist
    // // NB! it could be useful to be able to apply a restriction that should be fulfilled. Fx ?foi a bot:Element
    // postCalc(input: PostPutCalc) {
        
    //     // Get global variables
    //     var host = this.host;

    //     //Define variables
    //     var label = this.cleanLiteral(input.label);
    //     var comment = this.cleanLiteral(input.comment);
    //     var expression = input.expression;
    //     var argumentPaths = input.argumentPaths;
    //     var argumentVars: string[] = [];
    //     var propertyURI = this.cleanURI(input.inferredProperty);
        
    //     //Optional
    //     var foiURI = this.cleanURI(input.foiURI); //If only for a specific FoI
    //     var queryType = input.queryType ? input.queryType : this.queryType;     // Get default if not defined
    //     var userURI = this.cleanURI(input.userURI);
    //     var path = this.cleanPath(input.path);
    //     var pathString = this.cleanLiteral(input.path);

    //     //Clean argument paths and retrieve argument variables
    //     argumentVars = this.cleanArgPaths(argumentPaths).vars;
    //     argumentPaths = this.cleanArgPaths(argumentPaths).paths;
    //     var expressionVars = this.uniqueVarsInString(expression);

    //     // Validate
    //     if(!label) return new Error('Please specify a label');
    //     if(!expression) return new Error('Specify an expression');
    //     if(!argumentPaths) return new Error(`Specify ${expressionVars.length} argument path(s)`);
    //     if(expressionVars.length != argumentPaths.length) return new Error('There is a mismatch between number of arguments used in the expression and the number of argument paths given');
    //     if(!_.isEqual(expressionVars.sort(), argumentVars.sort())) return new Error(`There is a mismatch between the arguments given in the expression (${expressionVars.sort()}) and the arguments given in the paths (${argumentVars.sort()})`);

    //     var q: string = '';

    //     // define a few variables to use with named graphs
    //     var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
    //     var b = this.mainGraph ? '' : '\t';
    //     var c = this.mainGraph ? '' : '\t}\n';
                        
    //     if(queryType == 'construct') q+= '\nCONSTRUCT {\n';
    //     if(queryType == 'insert') {
    //         q+= '\nINSERT {\n';
    //         if(!this.mainGraph) q+= `\tGRAPH <${host}> {\n`;
    //     }

    //     q+= `${b}\t?foi ?inferredProperty ?propertyURI .\n` +
    //         `${b}\t?propertyURI a opm:Property ;\n` +
    //         `${b}\t\topm:hasState ?stateURI .\n` +
    //         `${b}\t?stateURI a opm:CurrentState , opm:Derived , ?assumed ;\n` +
    //         `${b}\t\topm:valueAtState ?res ;\n` +
    //         `${b}\t\tprov:generatedAtTime ?now ;\n` +
    //         `${b}\t\tprov:wasDerivedFrom `;

    //     for(var i in argumentPaths){
    //         var _i = Number(i)+1;
    //         q+= `?state${_i}`
    //         q+= (argumentPaths.length == _i) ? ' ;\n' : ' , ';
    //     }

    //     q+= `${b}\t\tprov:wasAttributedTo ?calculationURI .\n` +
    //         `${b}\t?calculationURI a opm:Calculation ;\n` +
    //         `${b}\t\trdfs:label ${label} ;\n`;
        
    //     if(path) q+= `${b}\t\topm:pathRestriction ${pathString} ;\n`;
    //     if(comment) q+= `${b}\t\trdfs:comment ${comment} ;\n`;
    //     if(userURI) q+= `${b}\t\tprov:wasAttributedTo ${userURI} ;\n`;

    //     q+= `${b}\t\tprov:generatedAtTime ?now ;\n` +
    //         `${b}\t\topm:inferredProperty ?inferredProperty ;\n` +
    //         `${b}\t\topm:expression "${expression}" ;\n` +
    //         `${b}\t\topm:argumentPaths ?bn0 .\n`;

    //     _.each(argumentPaths, (obj, i) => {
    //         q+= `${b}\t\t?bn${i} `;
    //         q+= `rdf:first "${argumentPaths[i]}" ;\n`;
    //         q+= `${b}\t\t\trdf:rest `;
    //         q+= (argumentPaths.length == Number(i)+1) ? 'rdf:nil .\n' : `?bn${i+1} .\n`;
    //     });

    //     if(!this.mainGraph) q+= c;
    //     q+= `}\n`;

    //     // Get data
    //     q+= `WHERE {\n`;
    //     q+= a;

    //     if(foiURI) q+= `${b}\tBIND(${foiURI} AS ?foi)\n`;

    //     q+= `${b}\tBIND(${propertyURI} AS ?inferredProperty)\n\n`;

    //     q+= `${b}\t# MAKE A URI FOR THE CALCULATION\n` +
    //         `${b}\tBIND(URI(CONCAT("${host}", "calculation_", STRUUID())) AS ?calculationURI)\n\n`;

    //     q+= `${b}\t# MAKE NODES FOR CALCULATION LIST\n`;

    //     _.each(argumentPaths, (obj, i) => {
    //         q+= `${b}\tBIND(URI(CONCAT("${host}", "bn_", STRUUID())) AS ?bn${i})\n`;
    //     });
    //     q+= '\n';

    //     if(path) {
    //         q+= `${b}\t# PATH TO BE MATCHED\n` +
    //             `${b}\t${path}\n\n`
    //     }

    //     // Retrieve data
    //     for (var i in argumentPaths){
    //         var _i = Number(i)+1;
    //         q+= `${b}\t# GET ARGUMENT ${_i} DATA\n` +
    //             `${b}\t${argumentPaths[i]}_ .\n` +
    //             `${b}\t${argumentVars[i]}_ opm:hasState ?state${_i} .\n` +
    //             `${b}\t?state${_i} a opm:CurrentState ;\n` +
    //             `${b}\t\topm:valueAtState ${argumentVars[i]} .\n` +
    //             `${b}\t# INHERIT CLASS OPM:ASSUMED\n` +
    //             `${b}\tOPTIONAL {\n` +
    //             `${b}\t\t?state${_i} a ?assumed .\n` +
    //             `${b}\t\tFILTER( ?assumed = opm:Assumed )\n` +
    //             `${b}\t}\n\n`;
    //     }

    //     // No previous calculations must exist
    //     q+= `${b}\t# DO NOT APPEND IF PROPERTY ALREADY DEFINED\n` +
    //         `${b}\tMINUS { ?foi ?inferredProperty ?prop }\n\n`;

    //     q+= `${b}\t# PERFORM CALCULATION\n` +
    //         `${b}\tBIND((${expression}) AS ?res)\n\n` +

    //         `${b}\t# CREATE STATE AND PROPERTY URIs\n` +
    //         `${b}\tBIND(URI(CONCAT("${host}", "state_", STRUUID())) AS ?stateURI)\n` +
    //         `${b}\tBIND(URI(CONCAT("${host}", "property_", STRUUID())) AS ?propertyURI)\n\n` +

    //         `${b}\t# GET CURRENT TIME\n` +
    //         `${b}\tBIND(now() AS ?now)\n`;
        
    //     if(!this.mainGraph) q+= c;

    //     q+= '}';

    //     return this.appendPrefixesToQuery(q);
    // }
    
    // Insert derived values matching some calculation where they do not already exist
    // NB! it could be useful to be able to apply a restriction that should be fulfilled. Fx ?foi a bot:Element
    postCalc(input: PostPutCalc) {

        // Get global variables
        var host = this.host;

        //Define variables
        var calculationURI = this.cleanURI(input.calculationURI);
        var expression = input.expression;
        var argumentPaths = input.argumentPaths;
        var argumentVars: string[] = [];
        var propertyURI = this.cleanURI(input.inferredProperty);
        
        //Optional
        var foiURI = this.cleanURI(input.foiURI); //If only for a specific FoI
        var queryType = input.queryType ? input.queryType : this.queryType;     // Get default if not defined
        var path = this.cleanPath(input.path);

        //Clean argument paths and retrieve argument variables
        argumentVars = this.cleanArgPaths(argumentPaths).vars;
        argumentPaths = this.cleanArgPaths(argumentPaths).paths;
        var expressionVars = this.uniqueVarsInString(expression);

        if(!expression) return new Error('Specify an expression');
        if(!argumentPaths) return new Error(`Specify ${expressionVars.length} argument path(s)`);
        if(expressionVars.length != argumentPaths.length) return new Error('There is a mismatch between number of arguments used in the expression and the number of argument paths given');
        if(!_.isEqual(expressionVars.sort(), argumentVars.sort())) return new Error(`There is a mismatch between the arguments given in the expression (${expressionVars.sort()}) and the arguments given in the paths (${argumentVars.sort()})`);

        var q: string = '';

        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';
                      
        if(queryType == 'construct') q+= '\nCONSTRUCT {\n';
        if(queryType == 'insert') {
            q+= '\nINSERT {\n';
            if(!this.mainGraph) q+= `\tGRAPH <${host}> {\n`;
        }

        q+= `${b}\t?foi ?inferredProperty ?propertyURI .\n` +
            `${b}\t?propertyURI a opm:Property ;\n` +
            `${b}\t\topm:hasState ?stateURI .\n` +
            `${b}\t?stateURI a opm:CurrentState , opm:Derived , ?assumed ;\n` +
            `${b}\t\topm:valueAtState ?res ;\n` +
            `${b}\t\tprov:generatedAtTime ?now ;\n`;
        
        if(calculationURI) q+= `${b}\t\tprov:wasAttributedTo ${calculationURI} ;\n`;
            
        q+= `${b}\t\tprov:wasDerivedFrom `;

        for(var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `?state${_i}`
            q+= (argumentPaths.length == _i) ? ' .\n' : ' , ';
        }

        if(!this.mainGraph) q+= c;
        q+= `}\n`;

        // Get data
        q+= `WHERE {\n`;
        q+= a;

        if(foiURI) q+= `${b}\tBIND(${foiURI} AS ?foi)\n`;

        q+= `${b}\tBIND(${propertyURI} AS ?inferredProperty)\n\n`;

        if(path) {
            q+= `${b}\t# PATH TO BE MATCHED\n` +
                `${b}\t${path}\n\n`
        }

        // Retrieve data
        for (var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `${b}\t# GET ARGUMENT ${_i} DATA\n` +
                `${b}\t${argumentPaths[i]}_ .\n` +
                `${b}\t${argumentVars[i]}_ opm:hasState ?state${_i} .\n` +
                `${b}\t?state${_i} a opm:CurrentState ;\n` +
                `${b}\t\topm:valueAtState ${argumentVars[i]} .\n` +
                `${b}\t# INHERIT CLASS OPM:ASSUMED\n` +
                `${b}\tOPTIONAL {\n` +
                `${b}\t\t?state${_i} a ?assumed .\n` +
                `${b}\t\tFILTER( ?assumed = opm:Assumed )\n` +
                `${b}\t}\n\n`;
        }

        // No previous calculations must exist
        q+= `${b}\t# DO NOT APPEND IF PROPERTY ALREADY DEFINED\n` +
            `${b}\tMINUS { ?foi ?inferredProperty ?prop }\n\n`;

        q+= `${b}\t# PERFORM CALCULATION\n` +
            `${b}\tBIND((${expression}) AS ?res)\n\n` +

            `${b}\t# CREATE STATE AND PROPERTY URIs\n` +
            `${b}\tBIND(URI(CONCAT("${host}", "state_", STRUUID())) AS ?stateURI)\n` +
            `${b}\tBIND(URI(CONCAT("${host}", "property_", STRUUID())) AS ?propertyURI)\n\n` +

            `${b}\t# GET CURRENT TIME\n` +
            `${b}\tBIND(now() AS ?now)\n`;
        
        if(!this.mainGraph) q+= c;

        q+= '}';

        return this.appendPrefixesToQuery(q);
    }

    putCalc(input): string{

        // Get global variables
        var host = this.host;
        
        // Define variables
        var calculationURI = this.cleanURI(input.calculationURI);
        var expression = input.expression;
        var argumentPaths = input.argumentPaths;
        var argumentVars: string[] = [];
        var propertyURI = this.cleanURI(input.inferredProperty);

        // Optional
        var foiURI = this.cleanURI(input.foiURI); //If only for a specific FoI
        var queryType = input.queryType ? input.queryType : this.queryType;     // Get default if not defined

        //Clean argument paths and retrieve argument variables
        argumentVars = this.cleanArgPaths(argumentPaths).vars;
        argumentPaths = this.cleanArgPaths(argumentPaths).paths;

        var q: string = '';

        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';

        if(queryType == 'construct') q+= '\nCONSTRUCT {\n';
        if(queryType == 'insert') {
            // FIRST DELETE CURRENT STATE CLASS FROM PREVIOUS STATE
            q+= '\nDELETE {\n';
            if(!this.mainGraph) q+= `\tGRAPH <${host}> {\n`;
            q+= `${b}\t?previousState a opm:CurrentState .\n`;
            if(!this.mainGraph) q+= c;
            q+= '}\n' +
                'INSERT {\n';
            if(!this.mainGraph) q+= `\tGRAPH <${host}> {\n`;
            q+= `${b}\t?previousState a opm:State .\n`;
        }

        q+= `${b}\t?propertyURI a opm:Property ;\n` +
            `${b}\t\topm:hasState ?stateURI .\n` +
            `${b}\t?stateURI a opm:CurrentState , opm:Derived , ?assumed ;\n` +
            `${b}\t\topm:valueAtState ?res ;\n` +
            `${b}\t\tprov:generatedAtTime ?now ;\n` +
            `${b}\t\tprov:wasAttributedTo ${calculationURI} ;\n` +
            `${b}\t\tprov:wasDerivedFrom `;

        for(var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `?state${_i}`
            q+= (argumentPaths.length == _i) ? ' .\n' : ' , ';
        }
        if(!this.mainGraph) q+= c;

        // Get data
        q+= `}\nWHERE {\n`;

        if(!this.mainGraph) q+= a;

        //BIND to FoIURI if one is given
        if(foiURI) q+= `${b}\tBIND(${foiURI} AS ?foi)\n`;
            
        q+= `${b}\tBIND(${propertyURI} AS ?inferredProperty)\n\n`;

        q+= `${b}\t# GET THE STATES THAT THE LATEST CALCULATION WAS DERIVED FROM\n` +
            `${b}\t{ SELECT ?foi WHERE {\n` +
            `${b}\t\t?foi ?inferredProperty ?propertyURI .\n` +
            `${b}\t\t?propertyURI opm:hasState [\n` +
            `${b}\t\t\ta opm:CurrentState ;\n` +
            `${b}\t\t\tprov:wasDerivedFrom ?derivedFrom ] .\n` +
            `${b}\t\t# ONLY RETURN IF AN INPUT HAS CHANGED SINCE LAST CALCULATION\n` +
            `${b}\t\tMINUS { ?derivedFrom a opm:CurrentState }\n` +
            `${b}\t} GROUP BY ?foi }\n\n` +

            `${b}\t# GET LATEST STATE\n` +
            `${b}\t?foi ?inferredProperty ?propertyURI .\n` +
            `${b}\t?propertyURI opm:hasState ?previousState .\n` +
            `${b}\t?previousState a opm:CurrentState .\n\n`;

        // Retrieve data
        for (var i in argumentPaths){
            var _i = Number(i)+1;
            q+= `${b}\t# GET ARGUMENT ${_i} DATA\n` +
                `${b}\t${argumentPaths[i]}_ .\n` +
                `${b}\t${argumentVars[i]}_ opm:hasState ?newState${_i} .\n` +
                `${b}\t?newState${_i} a opm:CurrentState ;\n` +
                `${b}\t\topm:valueAtState ${argumentVars[i]} .\n` +
                `${b}\t# INHERIT CLASS OPM:ASSUMED\n` +
                `${b}\tOPTIONAL {\n` +
                `${b}\t\t?newState${_i} a ?assumed .\n` +
                `${b}\t\tFILTER( ?assumed = opm:Assumed )\n` +
                `${b}\t}\n\n`;
        }

        q+= `${b}\t# PERFORM CALCULATION\n` +
            `${b}\tBIND((${expression}) AS ?res)\n\n` +

            `${b}\t# CREATE STATE URIs\n` +
            `${b}\tBIND(URI(CONCAT("${host}", "state_", STRUUID())) AS ?stateURI)\n` +
            `${b}\t# GET CURRENT TIME\n` +
            `${b}\tBIND(now() AS ?now)\n`;

        if(!this.mainGraph) q+= c;            

        q+= '}';

        return this.appendPrefixesToQuery(q);
    }


    public getOutdated(foiURI?, queryType?) {

        // Get global variables
        var mainGraph = this.mainGraph;

        // Process variables
        foiURI = this.cleanURI(foiURI);
        queryType = queryType ? queryType : this.queryType;     // Get default if not defined

        var q = '';

        // define a few variables to use with named graphs
        var a = this.mainGraph ? '' : '\tGRAPH ?g {\n';
        var b = this.mainGraph ? '' : '\t';
        var c = this.mainGraph ? '' : '\t}\n';
                      
        if(queryType == 'construct') {
            q+= '\nCONSTRUCT {\n' +
                `\t?foi ?hasProp ?prop .\n` +
                `\t?prop opm:hasState ?state .\n` +
                `\t?state a opm:CurrentState , opm:Derived ;\n` +
                `\t\tprov:wasDerivedFrom ?derivedFrom .\n\n` +
                `}\n`;

        }
        if(queryType == 'select') {
            q+= 'SELECT *\n';
        }

        q+= `WHERE {\n`;
        q+= a; // handle named graph

        if(foiURI) q+= `\tBIND(${foiURI} AS ?foi)\n`;

        q+= `${b}\t?foi ?hasProp ?prop .\n` +
            `${b}\t?prop opm:hasState ?state .\n` +
            `${b}\t?state a opm:CurrentState , opm:Derived ;\n` +
            `${b}\t\tprov:wasDerivedFrom ?derivedFrom .\n\n` +

            `${b}\t# RETURN ONLY IF AN ARGUMENT HAS CHANGED\n` +
            `${b}\tMINUS { ?derivedFrom a opm:CurrentState }\n` + 
            `${b}}`;
            
        if(queryType == 'select') q+= `GROUP BY ?foi\n`;

        return this.appendPrefixesToQuery(q);
                          
    }

}
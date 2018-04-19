import * as _ from "underscore";
import * as _s from "underscore.string";

declare var require: any;

export interface Base {
    host: string;
    label?: string;
    comment?: string;
    userURI?: string;
    graphURI?: string;
    mainGraph?: boolean;
    queryType?: string;
}

export interface Prefix {
    prefix: string;
    uri: string;
}

export interface Literal {
    value: string;
    datatype?: string;
}

export interface ReliabilityOption {
    key: string;
    class: string;
}

export class BaseModel {

    public host: string;                                // used when creating new URIs
    public prefixes: Prefix[];                          // prefixeses to be appended to all queries
    public queryType: string;                           // query type (construct/select/insert)
    public reliabilityOptions: ReliabilityOption[];     // reliability mappings
    public mainGraph: boolean;                          // query the main graph or a named graph?

    constructor(host: string, prefixes?: Prefix[], mainGraph?: boolean){

        // Get host
        this.host = host;

        // Get predefined prefixes
        this.prefixes = require('../config.json').prefixes;

        // Append custom prefixes
        if(prefixes){
            this.prefixes = this._concatenatePrefixes(prefixes);
        }

        // Default query type is construct
        this.queryType = 'construct';

        // Query main graph as default
        this.mainGraph = mainGraph != undefined ? mainGraph : true;
    }

    public addPrefix(prefix: Prefix){
        this.prefixes = this._concatenatePrefixes([prefix]);
    }

    public mapReliability(reliability: string){

        // Get reliability mappings
        var mappings = require('../config.json').reliabilityMappings;

        // Derived can not be set as it is only inferred for derived properties
        var options = _.filter(mappings, obj => (obj.key != 'derived'));

        // Return error if 
        if(!_.chain(options).filter(obj => (obj.key == reliability) ).first().value()){
            var err = "Unknown restriction. Use either "+_s.toSentence(_.pluck(options, 'key'), ', ', ' or ');
            return new Error(err);
        }
        // Map and return class
        return _.chain(options).filter(obj => (obj.key == reliability) ).map(obj => obj.class).first().value();
    }

    // Concatenate new and predefined prefixes while filtering out duplicates
    private _concatenatePrefixes(newPrefixes): any {
        var prefixes = this.prefixes;
        if(newPrefixes){
            prefixes = prefixes.concat(newPrefixes);
            //Remove duplicates
            return _.map(_.groupBy(prefixes, obj => {
                return obj.prefix;
            }), grouped => {
                return grouped[0];
            })
        }
    }

    public cleanPath(path){

        if(!path) return undefined;

        // Trim spaces before and after
        path = path.trim();

        // Make array with sub-parts of path
        var el = path.split(' ');

        // Get subject and change it to ?foi if it is not already defined so
        if(el[0] != '?foi') path = path.replace(el[0], '?foi');

        // Make sure that it ends with a .
        if(path[path.length-1] != '.') path = path+' .';

        // Break at .
        path = path.replace('.', '.\n');

        // Break and indent at ;
        path = path.replace(';', ';\n\t\t');

        return path;
    }

    // Extracts the unique SPARQL variables from a string
    // Optionally, give it an array to include in the search
    public uniqueVarsInString(str, array?){
        if(!array) array = [];
        const regex = /\?[a-zA-Z]+/g;
        let m;
        
        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            
            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                if(array.indexOf(match) == -1){
                    array.push(match);
                }
            });
        }
        return array;
    }

    public nameSpacesInQuery(str){
        var array = [];
        const regex = /[a-zA-Z]+\:/g;
        let m;
        
        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            
            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                match = match.slice(0, -1);
                if(array.indexOf(match) == -1){
                    array.push(match);
                }
            });
        }
        return array;
    }

    // Clean argument paths and return the variables used for the arguments
    public cleanArgPaths(paths): any{
        var vars: string[] = [];
        // Argument paths should not include space and dot in end
        var paths = _.chain(paths).map(path => {
            //Find the first variable
            var firstVar = '?'+_s.strLeft(_s.strRight(path, '?'), ' ');
            if(firstVar != '?foi'){
                path = path.replace(firstVar, '?foi');
            }
            return path;
        }).map(path => {
            //Find last variable
            var lastVar = '?'+_s.strRightBack(path, '?');

            //remove things after space if any
            if(_s.contains(lastVar, ' ')){
                vars.push(_s.strLeftBack(lastVar, ' '));
                return _s.strLeftBack(path, ' ');
            }
            vars.push(lastVar);
            return path;
        }).value();
        return {paths: paths, vars: vars};
    }

    // clean URI by adding <> if it is a full URI
    public cleanURI(someURI){

        if(!someURI) return undefined;

        // If it doesn't contain http, just return it as is
        if(someURI.indexOf('http') == -1){
            return someURI;

        // If not and it already has <> just return as is
        }else if(someURI[0] == '<' && someURI[someURI.length-1] == '>'){
            return someURI;
        }else{
            return `<${someURI}>`;
        }
    }

}
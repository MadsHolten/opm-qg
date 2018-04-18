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
    public err: Error;

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
            this.err = new Error(err);
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

    cleanPath(path){

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

    // clean URI by adding <> if it is a full URI
    cleanURI(someURI){

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
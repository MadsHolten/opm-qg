import * as _ from "lodash";
import * as _s from "underscore.string";

declare var require: any;

export interface Base {
    host: string;
    iGraph?: string;
    label?: string;
    comment?: string;
    userURI?: string;
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
    public iGraph: string;                              // named graph to use for inferred triples
    public namedGraphs: string[];                       // Limit to only query over a limited set of named graphs (SPARQL FROM NAMED)

    constructor(host: string, prefixes?: Prefix[], mainGraph?: boolean, iGraph?: string, namedGraphs?: string[]){

        // Get host
        this.host = host.slice(-1) == '/' ? host : host + '/';

        // Get predefined prefixes
        this.prefixes = require('./config.json').prefixes;

        // Append custom prefixes
        if(prefixes){
            this.prefixes = this._concatenatePrefixes(prefixes);
        }

        // Default query type is construct
        this.queryType = 'construct';

        // Query main graph as default
        this.mainGraph = mainGraph != undefined ? mainGraph : true;

        // Inference graph defaults to host+I
        this.iGraph = iGraph && null != iGraph ? iGraph : this.host+'I';

        // namedGraphs
        if(namedGraphs){
            this.namedGraphs = namedGraphs;
        }

    }

    public addPrefix(prefix: Prefix){
        this.prefixes = this._concatenatePrefixes([prefix]);
    }

    public getPrefixes(){
        return this.prefixes;
    }

    // Convert prefixes to JSON-LD context file format
    public getJSONLDContext(){
        var context = {};
        _.each(this.prefixes, x => {
            context[x.prefix] = x.uri;
        });
        return context;
    }

    public mapReliability(reliability: string){

        // Get reliability mappings
        var mappings = require('./config.json').reliabilityMappings;

        // Derived can not be set as it is only inferred for derived properties
        var options = _.filter(mappings, obj => (obj.key != 'derived'));

        // Return error if 
        if(!_.chain(options).filter(obj => (obj.key == reliability) ).first().value()){
            var err = "Unknown restriction. Use either "+_s.toSentence(_.map(options, o => o.key), ', ', ' or ');
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
        const regex = /\?[a-zA-Z0-9]+/g;
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

    /**
     * 
     * @param query 
     * 1) Extract all namespaces used in the query using nameSpacesInQuery()
     * 2) Get URIs from match with this.prefixes
     * 3) Create string in form `PREFIX pfx: <someURI>`
     */
    public appendPrefixesToQuery(query){
        
        // Extract namespaces used in the query
        var namespaces = this.nameSpacesInQuery(query);
        
        // Get the URIs of the prefixes and append them to the query
        var p = '';
        _.each(namespaces, ns => {
            var match = _.filter(this.prefixes, pfx => pfx.prefix == ns)[0];
            if(match){
                p+= `PREFIX  ${ns}: <${match.uri}>\n`;
            }
            else {
                return new Error('Unknown prefix '+ns);
            }
        })
        return p+query;

    }

    // Clean argument paths and return the variables used for the arguments
    public cleanArgPaths(paths): any{

        var vars: string[] = [];

        // Argument paths should not include space and dot in end
        paths = _.chain(paths).map(path => {

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

    // Append inference rules to arg paths
    // For exampe '?foi a ?class' to '?foi a/rdfs:subClassOf+ ?class'
    public argPathInferenceAppend(paths): any{

        return paths.map(path => {

            var pathElements = path.split(' ');

            pathElements = pathElements.map(w => {
                
                // Replace 'a' with 'a/rdfs:subClassOf+'
                if(w == 'a') w = 'a/rdfs:subClassOf+';

                // Replace 'rdf:type' with 'rdf:type/rdfs:subClassOf+'
                if(w == 'rdf:type') w = 'rdf:type/rdfs:subClassOf+';

                return w;
            })

            path = pathElements.join(' ');

            return path;
        })

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

    /**
     * CLEAN STRING
     * Strings can be either defined just as the text or as text + language/datatype "text"@en / "text"^^xsd:string
     * @param string test string to clean
     */
    public cleanLiteral(string) {
        if(!string) return undefined;

        // If begins with "
        if(string[0] == '"'){
            return string;
        }else{
            return `"${string}"`;
        }

    }

    public cleanProp(string) {

        // Handle properties that are not in quotation marks
        if(!string.startsWith('"')){
            string = `"${string}"`;
        }
    
        // Process line breaks
        var s = string.replace(/\n/g,'\\n');
    
        // Process quotation marks
        // Get string between outer quotation marks
        var subString = s.substring(
            s.indexOf('"') + 1, 
            s.lastIndexOf('"')
        );
        
        // If there are quotation marks inside the outer quotation marks these are replaced with '
        if(subString && subString.indexOf('"') != -1){
            var newString = subString.replace(/\"/g, "'");
            s = s.replace(subString, newString);
        }

        console.log(s);
    
        return s;
    }

}
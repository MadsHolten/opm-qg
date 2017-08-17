import * as _ from "underscore";
import * as _s from "underscore.string";

export interface Base {
    label?: string;
    comment?: string;
    userURI?: string;
    prefixes: Prefix[];
    graphURI?: string;
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

    public prefixes: Prefix[];
    public queryType: string;
    public reliabilityOptions: ReliabilityOption[];
    public relia

    constructor() {
        //Predefined prefixes
        this.prefixes = [
            {prefix: 'rdf', uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'},
            {prefix: 'xsd', uri: 'http://www.w3.org/2001/XMLSchema#'},
            {prefix: 'prov', uri: 'http://www.w3.org/ns/prov#'},
            {prefix: 'opm', uri: 'https://w3id.org/opm#'},
            {prefix: 'seas', uri: 'https://w3id.org/seas/'},
            {prefix: 'sd', uri: 'http://www.w3.org/ns/sparql-service-description#'}
        ]
        //Default query type is construct
        this.queryType = 'construct';
        //Reliability options
        this.reliabilityOptions = [
            {'key': 'deleted', 'class': 'opm:Deleted'},
            {'key': 'assumption', 'class': 'opm:Assumption'},
            {'key': 'derived', 'class': 'opm:Derived'},
            {'key': 'confirmed', 'class': 'opm:Confirmed'}
        ];
    }

    //Concatenate new and predefined prefixes while filtering out duplicates
    concatenatePrefixes(newPrefixes): any {
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

}
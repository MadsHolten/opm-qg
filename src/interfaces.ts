export interface ICalc {
    args: IArgs[];
    label?: string;
    comment?: string;
    result: IRes;
    hostURI: string;
    foiURI?: string;
    userURI?: string;
    prefixes?: IPrefix[];
    queryType: queryType;
}

export interface IProp {
    comment?: string;
    foiURI?: string;
    propertyURI?: string;
    userURI?: string;
    objectProperty?: boolean;
    latest?: boolean;
    pattern?: string;
    value?: IVal;
    hostURI?: string;
    prefixes?: IPrefix[];
    language?: string;
    queryType?: QueryType;
    restriction?: string;
}

interface IArgs {
    property: string;
    targetPath?: string;
}

interface IVal {
    unit?: string;
    datatype?: string;
    property: string;
    value?: string;
}

interface IRes extends IVal {
    calc: string;
}

interface IPrefix {
    prefix: string,
    uri: string
}

export enum QueryType {
    Construct = 'construct',
    Select = 'select'
}
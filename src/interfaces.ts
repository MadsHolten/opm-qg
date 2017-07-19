export interface ICalc {
    args: IArgs[];
    label?: string;
    comment?: string;
    result: IRes;
    hostURI: string;
    resourceURI?: string;
    userURI?: string;
    prefixes?: IPrefix[];
    queryType: string;
}

export interface IProp {
    comment: string;
    resourceURI?: string;
    propertyURI?: string;
    userURI?: string;
    objectProperty?: boolean;
    latest?: boolean;
    pattern: string;
    value: IVal;
    hostURI: string;
    prefixes?: IPrefix[];
    language: string;
    queryType: string;
}

export interface IArgs {
    property: string;
    targetPath?: string;
}

export interface IVal {
    unit?: string;
    datatype?: string;
    property: string;
    value?: string;
}

export interface IRes extends IVal {
    calc: string;
}

export interface IPrefix {
    prefix: string,
    uri: string
}
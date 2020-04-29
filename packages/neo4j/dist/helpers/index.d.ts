import { IExcludeType, NEO4J_MODULE_CONFIG } from '../injection.tokens';
export declare const mapToString: (a: IExcludeType[]) => string[];
export declare const exclude: (c: NEO4J_MODULE_CONFIG, type: "query" | "mutation", defaultExcludedTypes: IExcludeType[]) => {
    [x: string]: {
        exclude: IExcludeType[];
    };
};

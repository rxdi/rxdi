import * as formatError from 'apollo-errors';
import * as boom from 'boom';
export interface ServerErrors {
    name: any;
    data: {
        bg: {
            message: string;
        };
        en: {
            message: string;
        };
    };
}
export declare const attachErrorHandlers: (error: any, returnNull?: boolean) => formatError.ErrorInfo;
export declare const clientErrors: typeof formatError;
export declare const Boom: typeof boom;
export declare function createError(name: any, message: string, data?: any): void;
export declare const errorUnauthorized: () => never;

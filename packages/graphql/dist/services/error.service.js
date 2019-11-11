"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const formatError = require("apollo-errors");
const boom = require("boom");
exports.attachErrorHandlers = formatError.formatError;
exports.clientErrors = formatError;
exports.Boom = boom;
function createError(name, message, data) {
    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return (s4() +
            s4() +
            '-' +
            s4() +
            '-' +
            s4() +
            '-' +
            s4() +
            '-' +
            s4() +
            s4() +
            s4());
    }
    data = data || {};
    data.eid = guid();
    message = `(${data.eid}): ${message}`;
    const error = exports.clientErrors.createError(name, { message, data });
    return new error();
}
exports.createError = createError;
exports.errorUnauthorized = function () {
    throw new createError('unauthorized', 'You are unable to fetch data');
};

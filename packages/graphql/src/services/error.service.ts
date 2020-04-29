import * as formatError from 'apollo-errors';
import * as boom from 'boom';
export interface ServerErrors {
  name;
  data: { bg: { message: string }; en: { message: string } };
}
export const attachErrorHandlers = formatError.formatError;
export const clientErrors = formatError;
export const Boom = boom;
export function createError(name, message: string, data?: any): void {
  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return (
      s4() +
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
      s4()
    );
  }
  data = data || {};
  data.eid = guid();
  message = `(${data.eid}): ${message}`;
  const error = clientErrors.createError(name, { message, data });
  return new error();
}

export const errorUnauthorized = function() {
  throw new createError('unauthorized', 'You are unable to fetch data');
};

import * as boom from '@hapi/boom';
export interface ServerErrors {
  name;
  data: { bg: { message: string }; en: { message: string } };
}
export const Boom = boom;
export function createError(name, message: string, data?: any): void | Error {
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
  return new Error(JSON.stringify({ name, message, data }));
}

export const errorUnauthorized = function () {
  throw createError('unauthorized', 'You are unable to fetch data');
};

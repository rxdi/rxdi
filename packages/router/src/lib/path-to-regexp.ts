import { CompileOptions, PathToken, PathToRegexpOptions, RouteParams } from './types';

const DEFAULT_DELIMITER = '/';
const DEFAULT_DELIMITERS = './';

const PATH_REGEXP = new RegExp(
  ['(\\\\.)', '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'].join('|'),
  'g'
);

export function parse(str: string, options?: PathToRegexpOptions): (string | PathToken)[] {
  const tokens: (string | PathToken)[] = [];
  let key = 0;
  let index = 0;
  let path = '';
  const defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER;
  const delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS;
  let pathEscaped = false;
  let res: RegExpExecArray | null;

  while ((res = PATH_REGEXP.exec(str)) !== null) {
    const m = res[0];
    const escaped = res[1];
    const offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    if (escaped) {
      path += escaped[1];
      pathEscaped = true;
      continue;
    }

    let prev = '';
    const next = str[index];
    const name = res[2];
    const capture = res[3];
    const group = res[4];
    const modifier = res[5];

    if (!pathEscaped && path.length) {
      const k = path.length - 1;

      if (delimiters.indexOf(path[k]) > -1) {
        prev = path[k];
        path = path.slice(0, k);
      }
    }

    if (path) {
      tokens.push(path);
      path = '';
      pathEscaped = false;
    }

    const partial = prev !== '' && next !== undefined && next !== prev;
    const repeat = modifier === '+' || modifier === '*';
    const optional = modifier === '?' || modifier === '*';
    const delimiter = prev || defaultDelimiter;
    const pattern = capture || group;

    tokens.push({
      name: name || key++,
      prefix: prev,
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      partial: partial,
      pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?',
    });
  }

  if (path || index < str.length) {
    tokens.push(path + str.substr(index));
  }

  return tokens;
}

export function compile(
  str: string,
  options?: PathToRegexpOptions
): (data?: RouteParams, options?: CompileOptions) => string {
  return tokensToFunction(parse(str, options));
}

export function tokensToFunction(
  tokens: (string | PathToken)[]
): (data?: RouteParams, options?: CompileOptions) => string {
  const matches = new Array(tokens.length);

  for (let i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + (tokens[i] as PathToken).pattern + ')$');
    }
  }

  return function (data?: RouteParams, options?: CompileOptions): string {
    let path = '';
    const encode = (options && options.encode) || encodeURIComponent;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (typeof token === 'string') {
        path += token;
        continue;
      }

      const value = data ? data[token.name] : undefined;
      let segment: string;

      if (Array.isArray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but got array');
        }

        if (value.length === 0) {
          if (token.optional) continue;

          throw new TypeError('Expected "' + token.name + '" to not be empty');
        }

        for (let j = 0; j < value.length; j++) {
          segment = encode(value[j], token);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"');
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment;
        }

        continue;
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        segment = encode(String(value), token);

        if (!matches[i].test(segment)) {
          throw new TypeError(
            'Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"'
          );
        }

        path += token.prefix + segment;
        continue;
      }

      if (token.optional) {
        if (token.partial) path += token.prefix;
        continue;
      }

      throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'));
    }

    return path;
  };
}

function escapeString(str: string): string {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
}

function escapeGroup(group: string): string {
  return group.replace(/([=!:$/()])/g, '\\$1');
}

function flags(options?: PathToRegexpOptions): string {
  return options && options.sensitive ? '' : 'i';
}

function regexpToRegexp(path: RegExp, keys?: PathToken[]): RegExp {
  if (!keys) return path;

  const groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (let i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: '',
        delimiter: '',
        optional: false,
        repeat: false,
        partial: false,
        pattern: '',
      });
    }
  }

  return path;
}

function arrayToRegexp(path: (string | RegExp)[], keys?: PathToken[], options?: PathToRegexpOptions): RegExp {
  const parts: string[] = [];

  for (let i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  return new RegExp('(?:' + parts.join('|') + ')', flags(options));
}

function stringToRegexp(path: string, keys?: PathToken[], options?: PathToRegexpOptions): RegExp {
  return tokensToRegExp(parse(path, options), keys, options);
}

export function tokensToRegExp(
  tokens: (string | PathToken)[],
  keys?: PathToken[],
  options?: PathToRegexpOptions
): RegExp {
  options = options || {};

  const strict = options.strict;
  const start = options.start !== false;
  const end = options.end !== false;
  const delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER);
  const delimiters = options.delimiters || DEFAULT_DELIMITERS;
  const endsWith = []
    .concat(options.endsWith || [])
    .map(escapeString)
    .concat('$')
    .join('|');
  let route = start ? '^' : '';
  let isEndDelimited = tokens.length === 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (typeof token === 'string') {
      route += escapeString(token);
      isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1;
    } else {
      const capture = token.repeat
        ? '(?:' + token.pattern + ')(?:' + escapeString(token.delimiter) + '(?:' + token.pattern + '))*'
        : token.pattern;

      if (keys) keys.push(token);

      if (token.optional) {
        if (token.partial) {
          route += escapeString(token.prefix) + '(' + capture + ')?';
        } else {
          route += '(?:' + escapeString(token.prefix) + '(' + capture + '))?';
        }
      } else {
        route += escapeString(token.prefix) + '(' + capture + ')';
      }
    }
  }

  if (end) {
    if (!strict) route += '(?:' + delimiter + ')?';
    route += endsWith === '$' ? '$' : '(?=' + endsWith + ')';
  } else {
    if (!strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?';
    if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')';
  }

  return new RegExp(route, flags(options));
}

export function pathToRegexp(
  path: string | RegExp | (string | RegExp)[],
  keys?: PathToken[],
  options?: PathToRegexpOptions
): RegExp {
  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys);
  }

  if (Array.isArray(path)) {
    return arrayToRegexp(path, keys, options);
  }

  return stringToRegexp(path, keys, options);
}

// Attach static methods to pathToRegexp to match original usage if needed,
// but since we are exporting them individually, consumers can just import them.
// However, the original code used `pathToRegexp_1` which had static methods attached.
// We can just export them as named exports.

const fs = require('fs');
const escapeStringRegexp = require('escape-string-regexp');
const path = require('path');

const CWD = process.cwd();
const yn = require('yn');

const processAccordingFoundShebangs = bundles => {
  bundles.forEach(({ path }) => rewriteShebang(path));
};

const processAccordingConfiguration = (bundles, conf) => {
  conf.forEach(elem => {
    const { interpreter, files } = elem;
    files.forEach(file => {
      const bundle = bundles.find(({ name }) => name === file);
      if (bundle) {
        const { path } = bundle;
        writeShebang(path, interpreter);
      }
    });
  });
};

const validate = obj => {
  return (
    'interpreter' in obj &&
    typeof obj.interpreter === 'string' &&
    obj.interpreter !== '' &&
    'files' in obj &&
    Array.isArray(obj.files) &&
    obj.files.length &&
    obj.files.filter(file => fs.existsSync(path.join(CWD, file))).length
  );
};

const loadConfigFromPackageJson = () => {
  const packageJsonPath = path.join(CWD, 'package.json');
  if (existsFile(packageJsonPath)) {
    const packageJson = JSON.parse(readFile(packageJsonPath));
    if (
      packageJson &&
      'shebang' in packageJson &&
      Array.isArray(packageJson.shebang) &&
      packageJson.shebang.length
    ) {
      return packageJson.shebang;
    }
  }

  return [];
};

const loadConfigFromShebangRc = () => {
  const shebangRcPath = path.join(CWD, '.shebangrc');
  if (existsFile(shebangRcPath)) {
    const shebangRc = JSON.parse(readFile(shebangRcPath));
    if (shebangRc && Array.isArray(shebangRc) && shebangRc.length) {
      return shebangRc;
    }
  }

  return [];
};

const toAbsolutePath = files => files.map(file => path.join(CWD, file));

const getConfig = dynamicConfig => {
  const conf = [];

  const configData = dynamicConfig
    ? dynamicConfig
    : [...loadConfigFromPackageJson(), ...loadConfigFromShebangRc()];

  if (Array.isArray(configData) && configData.length) {
    configData
      .filter(elem => validate(elem))
      .forEach(elem => {
        elem.files = toAbsolutePath(elem.files);
        conf.push(elem);
      });
  }

  return conf;
};

const SHEBANG_REGEX = /#!(.*) (.*)\n/;
const BLANK_LINE_REGEX = /^(?=\n)$|^\s*|\s*$|\n\n+/gm;

const existsFile = path => {
  return fs.existsSync(path);
};

const readFile = path => {
  return fs.readFileSync(path, 'utf8');
};

const writeFile = (path, content) => {
  fs.writeFileSync(path, content);
};

const hasShebang = content => {
  return SHEBANG_REGEX.test(content);
};

const getShebang = content => {
  return SHEBANG_REGEX.exec(content)[0].replace(/\n/g, '');
};

const buildShebangLine = interpreter => {
  return `#!/usr/bin/env ${interpreter}`;
};

const rewriteShebang = path => {
  if (existsFile(path)) {
    const content = readFile(path);
    if (hasShebang(content)) {
      const shebang = getShebang(content);
      const re = new RegExp(escapeStringRegexp(shebang), 'gi');
      writeFile(
        path,
        `${shebang}\n${removeBlankLines(content.replace(re, ''))}`
      );
    }
  }
};

const writeShebang = (path, interpreter) => {
  if (existsFile(path)) {
    const content = readFile(path);
    if (!hasShebang(content)) {
      const shebang = buildShebangLine(interpreter);
      writeFile(path, `${shebang}\n${removeBlankLines(content)}`);
    }
  }
};

const removeBlankLines = content => {
  return content.replace(BLANK_LINE_REGEX, '');
};

const newBundle = (name, path) => ({
  name,
  path
});

const getBundles = bundle => {
  const { name: path, assets, childBundles } = bundle;
  const bundles = [];

  if (childBundles && childBundles.size) {
    childBundles.forEach(({ name: path, assets, type }) => {
      if (assets && assets.size && type !== 'map') {
        assets.forEach(({ name }) => {
          if (!bundles.find(b => b.name === name)) {
            bundles.push(newBundle(name, path));
          }
        });
      }
    });
  }

  if (path && assets) {
    if (assets && assets.size) {
      assets.forEach(({ name, type }) => {
        if (!bundles.find(b => b.name === name) && type !== 'map') {
          bundles.push(newBundle(name, path));
        }
      });
    }
  }

  return bundles;
};

// export {  processAccordingFoundShebangs,
//     processAccordingConfiguration, getConfig,

//     existsFile,
//     readFile,
//     hasShebang,
//     buildShebangLine,
//     rewriteShebang,
//     writeShebang,
//     getBundles

// };

module.exports = (bundler, dynamicConfig = null) => {
  if (
    'PARCEL_PLUGIN_SHEBANG' in process.env &&
    !yn(process.env.PARCEL_PLUGIN_SHEBANG)
  ) {
    return false;
  }

  bundler.on('bundled', bundle => {
    const bundles = getBundles(bundle);
    const conf = getConfig(dynamicConfig);

    if (bundles.length) {
      processAccordingFoundShebangs(bundles);
      if (conf.length) {
        processAccordingConfiguration(bundles, conf);
      }
    }
  });

  return true;
};

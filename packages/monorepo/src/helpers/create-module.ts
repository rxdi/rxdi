import { join } from 'path';
import { MAIN_FOLDER, CONFIG } from '../constants';
import { makeDir } from './make-dir';
import { promisify } from 'util';
import { writeFile } from 'fs';
import { createTsConfig } from './create-tsconfig';

export async function createModule(name: string, type: 'shared' | 'lib') {
  const mainFolder = join(process.cwd(), MAIN_FOLDER, CONFIG[type]);
  const sharedFolder = join(mainFolder, name);
  try {
    await makeDir(sharedFolder);
  } catch (e) {}
  await promisify(writeFile)(
    join(sharedFolder, 'index.ts'),
    `export function MyLibFunction() {
    return {}
  }`,
    { encoding: 'utf-8' }
  );
  await createTsConfig(
    {
      extends: '../../tsconfig.settings.json',
      compilerOptions: {
        declaration: true,
        composite: true,
        outDir: `../../../node_modules/${CONFIG[type]}/${name}`
      }
    },
    sharedFolder
  );
  const configPath = join(mainFolder, 'tsconfig.json');
  const referenceTypescriptConfig: {
    references: { path: string }[];
  } = require(configPath);
  if (!referenceTypescriptConfig.references) {
    throw new Error(`Missing "references" inside ${configPath}`);
  }
  const hasTheSameModule = referenceTypescriptConfig.references.find(
    r => r.path === `./${name}`
  );
  if (hasTheSameModule) {
    throw new Error(`Module already present with name ${name}`);
  }
  referenceTypescriptConfig.references.push({ path: `./${name}` });
  await createTsConfig(referenceTypescriptConfig, mainFolder);
}

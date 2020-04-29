import { makeDir } from './make-dir';
import { MAIN_FOLDER, CONFIG } from '../constants';
import { checkExist } from './check-exist';
import { join } from 'path';
import { createTsConfig } from './create-tsconfig';
import { createFrontend } from './create-frontend';
import { createLib } from './create-lib';
import { createBackend } from './create-backend';
import { writeFile } from './write-file';

export async function createWorkspace() {
  try {
    await makeDir(MAIN_FOLDER);
    await makeDir(join(process.cwd(), 'tasks'));
  } catch (e) {}
  await createTsConfig(
    {
      stacks: {
        start: {
          commands: {
            start: 'npx repo run -c ./tasks/run.json'
          }
        }
      }
    },
    process.cwd(),
    'repo.json'
  );
  await writeFile(join(process.cwd(), '.gitignore'), `node_modules\ndist\n.cache`);
  await writeFile(join(process.cwd(), '.npmrc'), `package-lock=false`);
  await createTsConfig(
    {
      stacks: {
        frontend: {
          options: {
            depends: ['api'],
            cwd: './src/@apps/frontend/',
            signal: 'Built in'
          },
          commands: {
            clean: 'rm -rf .cache',
            run: 'npm start'
          }
        },
        api: {
          options: {
            signal: 'SIGNAL_MAIN_API_STARTED',
            cwd: './src/@apps/api/'
          },
          commands: {
            clean: 'rm -rf .cache',
            run: 'npm start'
          }
        },
        compile: {
          options: {
            depends: ['frontend'],
            cwd: '.'
          },
          commands: {
            compile: 'repo compile --watch'
          }
        }
      }
    },
    join(process.cwd(), 'tasks'),
    'run.json'
  );
  await createTsConfig(
    {
      compilerOptions: {
        module: 'commonjs',
        target: 'es6',
        declaration: true,
        composite: true,
        moduleResolution: 'node',
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        removeComments: true,
        allowSyntheticDefaultImports: true,
        preserveConstEnums: true,
        sourceMap: true,
        strictNullChecks: false,
        forceConsistentCasingInFileNames: true,
        noFallthroughCasesInSwitch: true,
        noImplicitAny: false,
        noImplicitReturns: true,
        noImplicitThis: false,
        noUnusedLocals: true,
        noUnusedParameters: false,
        outDir: './node_modules',
        lib: [
          'es2017',
          'es2016',
          'es2015',
          'es6',
          'dom',
          'esnext.asynciterable'
        ],
        typeRoots: ['node_modules/@types']
      },
      include: ['./src/**/*'],
      exclude: ['node_modules/**/*', './src/**/*.spec.ts']
    },
    process.cwd()
  );

  await createTsConfig(
    {
      references: [{ path: './@lib/' }, { path: './@shared/' }],
      compilerOptions: {
        composite: true
      }
    },
    join(process.cwd(), MAIN_FOLDER)
  );
  await createTsConfig(
    {
      "name": "@rxdi/monorepo-example",
      "engines": {
        "node": "10"
      },
      "scripts": {
        "postinstall": "npx repo compile && npx repo install && npx repo compile",
        "start": "npx repo run start"
      },
      "devDependencies": {
        "@rxdi/monorepo": "0.0.28",
        "typescript": "3.6.3"
      },
      "private": true
    },
    process.cwd(),
    'package.json'
  );
  await createTsConfig(
    {
      compilerOptions: {
        target: 'es2015',
        module: 'commonjs',
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        strict: true,
        composite: true,
        esModuleInterop: true
      }
    },
    join(process.cwd(), MAIN_FOLDER),
    'tsconfig.settings.json'
  );
  for (const value of Object.values(CONFIG)) {

    const folder = join(process.cwd(), MAIN_FOLDER, value);
    if (!(await checkExist(folder))) {
      try {
        await makeDir(folder);
        await wait();
        if (value !== CONFIG.apps) {
          await createTsConfig(
            {
              references: [],
              compilerOptions: {
                composite: true
              }
            },
            folder
          );
        }
      } catch (e) {}
    }
  }
  await createFrontend(
    join(process.cwd(), MAIN_FOLDER, CONFIG.apps, 'frontend')
  );
  await createBackend(join(process.cwd(), MAIN_FOLDER, CONFIG.apps, 'api'));

  await createLib('gosho');
}

function wait() {
  return new Promise(resolve => setTimeout(() => resolve(), 100));
}

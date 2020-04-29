import { makeDir } from './make-dir';
import { join } from 'path';
import { createTsConfig } from './create-tsconfig';
import { writeFile } from './write-file';

export async function createBackend(path: string) {
  await makeDir(path);
  await writeFile(join(path, '.gitignore'), `node_modules\ndist\n.cache`);
  await writeFile(
    join(path, 'index.ts'),
    `import { MyLibFunction } from '@lib/gosho';
console.log(MyLibFunction())
console.log('SIGNAL_MAIN_API_STARTED')
  `
  );

  await createTsConfig(
    {
      scripts: {
        postinstall:
          'npx parcel build ./index.ts --experimental-scope-hoisting',
        start: 'npx gapi start --local --path=./index.ts'
      },
      browserslist: ['last 1 chrome versions'],
      devDependencies: {
        typescript: '^3.6.3'
      }
    },
    path,
    'package.json'
  );
  await createTsConfig(
    {
      references: [{ path: '../../tsconfig.json' }],
      compileOnSave: false,
      compilerOptions: {
        baseUrl: '.',
        sourceMap: true,
        composite: true,
        module: 'esnext',
        jsx: 'react',
        jsxFactory: 'h',
        declaration: true,
        moduleResolution: 'node',
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        esModuleInterop: true,
        target: 'es6',
        typeRoots: ['node_modules/@types'],
        lib: ['es2019', 'dom']
      }
    },
    path
  );
}


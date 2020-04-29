import { promisify } from 'util';
import { writeFile } from 'fs';
import { makeDir } from './make-dir';
import { join } from 'path';
import { createTsConfig } from './create-tsconfig';

export async function createFrontend(path: string) {
  await makeDir(path);
  await writeF(join(path, '.gitignore'), `node_modules\ndist\n.cache`);
  await writeF(
    join(path, 'index.html'),
    `<body></body>\n<script src="./main.ts"></script>`
  );
  await writeF(
    join(path, 'main.ts'),
    `
import { MyLibFunction } from '@lib/gosho';
console.log(MyLibFunction())

  `
  );

  await createTsConfig(
    {
      scripts: {
        postinstall:
          'npx parcel build ./index.html --experimental-scope-hoisting',
        start: 'npx parcel ./index.html'
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

async function writeF(path: string, content: string) {
  await promisify(writeFile)(path, content, { encoding: 'utf-8' });
}

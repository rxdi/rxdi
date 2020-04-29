import { spawn } from 'child_process';
import { CONFIG, MAIN_FOLDER } from '../constants';
import { join } from 'path';
import { promisify } from 'util';
import { readdir } from 'fs';

export function copyModules(type: keyof typeof CONFIG, cwd: string) {
  return new Promise(resolve => {
    const child = spawn(
      'cp',
      ['-r', join(process.cwd(), 'node_modules', CONFIG[type]), cwd],
      { cwd: process.cwd() }
    );
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('close', (code: number) => resolve(code));
  });
}

export async function copyNodeModules() {
  const apps = await promisify(readdir)(
    join(process.cwd(), MAIN_FOLDER, CONFIG.apps)
  );
  await Promise.all(
    apps.map(async app => {
      const appNodeModules = join(
        process.cwd(),
        MAIN_FOLDER,
        CONFIG.apps,
        app,
        'node_modules'
      );
      await copyModules('lib', appNodeModules);
      await copyModules('shared', appNodeModules);
    })
  );
}

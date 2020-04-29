import { spawn } from 'child_process';

export const NpmInstall = (cwd: string) => {
  return new Promise(resolve => {
    const child = spawn('npx', ['npm', 'install'], { cwd });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('close', (code: number) => resolve(code));
  });
};

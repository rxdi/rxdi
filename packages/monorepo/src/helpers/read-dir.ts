import { promisify } from 'util';
import { execFile } from 'child_process';

export async function readDir(path: string) {
  return (await promisify(execFile)('find', [
    '.',
    '-path',
    '*node_modules/*',
    '-prune',
    '-o',
    '-iname',
    '*.json',
    '-print'
  ], {cwd: path})).stdout.split('\n');
}

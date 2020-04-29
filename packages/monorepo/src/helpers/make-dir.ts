import { promisify } from 'util';
import { mkdir } from 'fs';

export async function makeDir(path: string) {
  return promisify(mkdir)(path);
}

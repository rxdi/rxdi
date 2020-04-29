import { promisify } from 'util';
import { exists } from 'fs';

export async function checkExist(path: string) {
  return promisify(exists)(path);
}

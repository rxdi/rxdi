import { promisify } from 'util';
import { writeFile } from 'fs';
import { join } from 'path';

export async function createTsConfig(json: Object, directory: string, name: string = 'tsconfig.json') {
  await promisify(writeFile)(join(directory, name), JSON.stringify(json, null, 2), {
    encoding: 'utf-8'
  });
}

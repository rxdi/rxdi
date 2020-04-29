import { promisify } from 'util';
import { writeFile as WF } from 'fs';

export async function writeFile(path: string, content: string) {
  await promisify(WF)(path, content, { encoding: 'utf-8' });
}

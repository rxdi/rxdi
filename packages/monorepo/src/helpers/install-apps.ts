import { join } from 'path';
import { MAIN_FOLDER, CONFIG } from '../constants';
import { NpmInstall } from './npm-install';
import { promisify } from 'util';
import { readdir } from 'fs';

export async function installApps() {
  const appsFolder = join(process.cwd(), MAIN_FOLDER, CONFIG.apps);
  const folders = await promisify(readdir)(appsFolder);
  console.log(`Executing 'npm install' on following @apps: '${folders}'`);
  await Promise.all(
    folders.map(folder => NpmInstall(join(appsFolder, folder)))
  );
}

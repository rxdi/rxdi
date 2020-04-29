import { join } from 'path';
import { promisify } from 'util';
import { readdir, exists, writeFile } from 'fs';
import { MAIN_FOLDER, CONFIG } from '../constants';

export async function reactOnChanges() {
  const apps = await promisify(readdir)(
    join(process.cwd(), MAIN_FOLDER, CONFIG.apps)
  );
  await Promise.all(
    apps.map(async app => {
      if (
        await promisify(exists)(
          join(process.cwd(), MAIN_FOLDER, CONFIG.apps, app, 'app-restart.ts')
        )
      ) {
        await promisify(writeFile)(
          join(process.cwd(), MAIN_FOLDER, CONFIG.apps, app, 'app-restart.ts'),
          '',
          { encoding: 'utf-8' }
        );
      }
    })
  );
}

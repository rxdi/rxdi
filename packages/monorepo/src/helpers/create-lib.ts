import { createModule } from './create-module';

export async function createLib(name: string) {
  await createModule(name, 'lib');
}

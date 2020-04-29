import { createModule } from './create-module';

export async function CreateShared(name: string) {
  await createModule(name, 'shared');
}

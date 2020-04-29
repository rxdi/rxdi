import { createLib } from '../helpers/create-lib';

export async function CreateLib(name: string) {
  await createLib(name);
}

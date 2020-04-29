import { compileWorkspace } from '../helpers/compile-workspace';
import { copyNodeModules } from '../helpers/copy-modules';

export async function Compile() {
  await compileWorkspace();
  await copyNodeModules();
  await compileWorkspace();
  await copyNodeModules();
}

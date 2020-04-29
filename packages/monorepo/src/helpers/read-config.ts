import { join } from 'path';
import { nextOrDefault } from './args-extrators';
export interface StackScriptOptions {
  cwd: string;
  depends: string[];
  signal: string;
}
export interface StackScriptCommands {
  [key: string]: string;
}
export interface StackScript {
  [key: string]: { commands: StackScriptCommands; options: StackScriptOptions };
}
export interface Stack {
  name: string;
  options?: StackScriptOptions;
  commands?: string[];
}
export async function readConfig(): Promise<{
  stacks: StackScript;
}> {
  console.log(nextOrDefault('-c', 'repo.json'))
  return require(join(process.cwd(), nextOrDefault('-c', 'repo.json')));
}

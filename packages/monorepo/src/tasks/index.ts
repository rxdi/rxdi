import { Create } from './create';
import { CreateLib } from './create-lib';
import { CreateShared } from '../helpers/create-shared';
import { Compile } from './compile';
import { Run } from './run';
import { Install } from './install';

export const Tasks = new Map<string, Function>([
  ['create', Create],
  ['lib', CreateLib],
  ['shared', CreateShared],
  ['compile', Compile],
  ['run', Run],
  ['install', Install],
]);

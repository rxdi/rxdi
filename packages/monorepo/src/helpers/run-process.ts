import {
  spawn,
  ChildProcessWithoutNullStreams,
  ChildProcess
} from 'child_process';
import { copyNodeModules } from './copy-modules';
import { reactOnChanges } from './react-on-changes';

const childProcesses = new Map<string, ChildProcess>();
export const RunProcess = (
  command: string,
  cwd: string = process.cwd(),
  signal?: string
) => {
  return new Promise(resolve => {
    let splittedCommand = command.split(' ');
    let defaultCommand = 'npx';
    if (splittedCommand.includes('#exit')) {
      process.exit(0);
    }
    if (splittedCommand.includes('>')) {
      defaultCommand = splittedCommand[1]
      splittedCommand = splittedCommand.filter(c => c !== '>' && c !== defaultCommand )
    }
    const child = spawn(defaultCommand, splittedCommand, { cwd });
    console.log(`Starting process: "${command}" Directory: ${cwd}`);
    childProcesses.set(cwd, child);
    child.stdout.on('data', async (message: Buffer) => {
      if (message.toString().includes(signal)) {
        console.log(`Resolve signal triggered '${signal}'`);
        resolve(message);
      }
      if (
        message.toString().includes('File change detected') &&
        cwd !== process.cwd()
      ) {
        await copyNodeModules();
        await reactOnChanges();
      }
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    process.stdin.resume(); //so the program will not close instantly

    function exitHandler(child: ChildProcessWithoutNullStreams) {
      child.kill();
    }

    //do something when app is closing
    process.on('exit', exitHandler.bind(null, child));

    //catches ctrl+c event
    process.on('SIGINT', () => process.exit());

    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler.bind(null, child));
    process.on('SIGUSR2', exitHandler.bind(null, child));

    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, child));
    child.on('close', (code: number) => resolve(code));
  });
};

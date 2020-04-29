import { Tasks } from './tasks';

async function Main() {
  let args = process.argv.slice(2);

  if (!Tasks.has(args[0])) {
    throw new Error(`Missing task ${args[0]}`);
  }
  try {
    await Tasks.get(args[0])(args[1]);
  } catch (e) {
    console.error(e);
  }
}

Main();

import { Subject } from 'rxjs';

import { PluginInit } from './plugin-init';

/**
 * Boot self-check (`initQuery`). A process that does not listen (hapi
 * `mode: 'lambda'`, e.g. a NATS-only service) used to POST to
 * `localhost:<configured port>` - another process's port - and crashed when
 * nothing answered. It must check ITSELF, and only a wrong answer from its
 * own schema may stop it.
 */
type Reply = { result?: unknown; payload?: string };

function setup(opts: {
  started?: number;
  port?: number;
  initQuery?: boolean;
  inject?: () => Promise<Reply>;
}) {
  const appStarted = new Subject<boolean>();
  const server = {
    info: { started: opts.started ?? 0, port: opts.port ?? 9000 },
    inject: jest.fn(
      opts.inject ??
        (async () => ({ result: { data: { status: { status: '200' } } } }))
    ),
    stop: jest.fn(async () => undefined)
  };
  const plugin = new PluginInit(
    server as never,
    { initQuery: opts.initQuery ?? true, path: '/graphql' } as never,
    { appStarted } as never
  );
  const sendRequest = jest
    .spyOn(plugin, 'sendRequest')
    .mockResolvedValue({ data: { status: { status: '200' } } } as never);
  return { plugin, server, sendRequest, start: () => appStarted.next(true) };
}

const flush = (ms = 0) => new Promise(ok => setTimeout(ok, ms));

describe('PluginInit self-check', () => {
  let exit: jest.SpyInstance;
  let log: jest.SpyInstance;
  beforeEach(() => {
    exit = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);
    log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('does nothing when initQuery is off', async () => {
    const t = setup({ initQuery: false });
    await t.plugin.register();
    t.start();
    await flush();
    expect(t.server.inject).not.toHaveBeenCalled();
    expect(t.sendRequest).not.toHaveBeenCalled();
  });

  it('lambda mode (not listening): checks itself in-process, no network', async () => {
    const t = setup({ started: 0 });
    await t.plugin.register();
    t.start();
    await flush();
    expect(t.server.inject).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', url: '/graphql' })
    );
    expect(t.sendRequest).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
  });

  it('listening: checks the port it really bound', async () => {
    const t = setup({ started: Date.now(), port: 9123 });
    await t.plugin.register();
    t.start();
    await flush();
    expect(t.sendRequest).toHaveBeenCalledWith(
      expect.anything(),
      'http://localhost:9123/graphql'
    );
    expect(t.server.inject).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
  });

  it('a check that cannot be delivered is retried, logged and never exits', async () => {
    const t = setup({
      inject: async () => {
        throw new Error('connect ECONNREFUSED');
      }
    });
    await t.plugin.register();
    t.start();
    await flush(2000); // 1 try + 3 retries, 500 ms apart
    expect(t.server.inject).toHaveBeenCalledTimes(4);
    expect(exit).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      '[@rxdi/graphql] init self-check could not run:',
      'connect ECONNREFUSED'
    );
  });

  it('a reply that is not GraphQL (404 body) never exits', async () => {
    const t = setup({
      inject: async () => ({ result: { statusCode: 404, error: 'Not Found' } })
    });
    await t.plugin.register();
    t.start();
    await flush(2000);
    expect(exit).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
  });

  it('a GraphQL answer from our own server without 200 still stops it', async () => {
    const t = setup({
      inject: async () => ({ result: { data: { status: { status: '500' } } } })
    });
    await t.plugin.register();
    t.start();
    await flush(50);
    expect(t.server.stop).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });
});

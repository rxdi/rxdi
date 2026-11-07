# graphql: the init self-check queries its own server and never crashes the process

## Summary

`PluginInit` (`initQuery: true`, the `@gapi/core` default) sends
`query { status { status } }` once the app has started, as a boot smoke
test. It always sent it over HTTP to `localhost:<configured port>`:

- In hapi **`mode: 'lambda'`** the server is only `initialize()`d and never
  listens, so that request went to **whatever other process owned the
  port**. With the port free it was refused, and the rejection had no
  handler, so the process exited (`TypeError: fetch failed` /
  `ECONNREFUSED`).
- Found in legends: its NATS-only engine runs `CoreModule` in lambda mode
  and died at boot whenever it started before the backend (which owns
  :9000). When the backend was up, the engine's "self-check" was answered
  by the backend and proved nothing about the engine.

Now the check always targets this very server, and a check that cannot be
delivered never kills the process.

## Changes (`packages/graphql/src/plugin-init.ts`)

| Situation | Before | After |
|---|---|---|
| Listening (`mode: 'server'`) | HTTP to `localhost:<port>/graphql` | HTTP to the port this server bound, on `config.path` |
| Not listening (`mode: 'lambda'`) | HTTP to `localhost:<configured port>` - another process or nothing | **in-process `server.inject()`** on `config.path` - no network |
| Network error / refused | unhandled rejection -> process exits | retried 3x (500 ms), then logged: `[@rxdi/graphql] init self-check could not run: <reason>` |
| Reply that is not GraphQL (e.g. a 404 body) | `res.data.status` -> TypeError -> exits | treated as undeliverable: retried, logged, keeps running |
| GraphQL answer from our own schema without `status: "200"` | stop server + `exit(1)` | **unchanged**: stop server + `exit(1)` |
| `initQuery: false` | no check | no check |

- New `selfCheck()`: `server.info.started` -> `sendRequest` to
  `http://localhost:${server.info.port}${path}`; otherwise
  `server.inject({ method: 'POST', url: path, payload })`.
- `register()`: `defer(selfCheck)` -> validate it is a GraphQL reply ->
  `retry({ count: 3, delay: 500 })` -> `checkStatus` -> `catchError` (log,
  `EMPTY`).
- `sendRequest`'s default URL uses `config.path` instead of a hard-coded
  `/graphql`.
- `checkStatus(status)` accepts `undefined` and compares with
  `String(status)`.

No config, API or behaviour change for a healthy server.

## Testing

- New `packages/graphql/src/plugin-init.spec.ts` (6 tests, `PluginInit`
  built with a fake hapi server):
  - `initQuery: false` -> no request at all
  - lambda mode -> `server.inject` POST `/graphql`, no HTTP request
  - listening -> HTTP to `http://localhost:<bound port>/graphql`
  - undeliverable (inject rejects) -> 4 attempts, error logged, no exit
  - 404 body -> logged, no exit
  - own schema answers `status: "500"` -> `server.stop()` + `exit(1)`
- Whole package: `npx jest` in `packages/graphql` -> **24/24** (12 suites);
  `tsc` builds.
- Real service: the built `dist/plugin-init.js` dropped into legends'
  `node_modules`, the backend stopped (nothing on :9000), the engine
  started alone: it booted, connected to NATS and stayed up, with no
  self-check error (the in-process check answered 200). The same setup
  crashed the engine before. (Reverted afterwards.)

## Release notes

`fix(graphql)` - picked up by the generated CHANGELOG at the next version.

## Follow-up after release

- legends: bump `@rxdi/graphql` (comes through `@gapi/core`), fix the
  engine's `Number(process.env.GRAPHQL_API_PORT) ?? 9001` (NaN when unset),
  drop the "start the backend before the engine" note in CLAUDE.md.
- hslcrash: bump only - its services are either in server mode on their own
  port or use plain `@rxdi/core` without GraphQL, so they never hit this.

# rxdi — Monorepo (2025) 🚀

**A collection of reactive, TypeScript-first packages for building modern Node and browser apps with dependency injection, GraphQL, Lit/Lit-HTML components and more.**

This repository contains a set of interoperable libraries published under the `@rxdi/*` namespace. Packages are built and released from this monorepo and are designed to work together — you can pick just the packages you need.

---

## What you’ll find here ✨

- A monorepo of packages (see `packages/`) that include: core dependency-injection, frontend helpers, GraphQL tooling, integrations (Neo4j, Firebase, RabbitMQ), utilities and more.
- Scripts and tooling to build, test and publish packages using Bolt (workspace runner) and the `gapi` helpers that are included in the project.

---

## Quick package overview 📦

Below is a concise summary of each package in this repo — open the package folder for full docs and examples.

| Package | Short description |
|---|---|
| `@rxdi/core` | Core reactive dependency-injection library for Node & Browser. (Bootstrap, modules, DI tokens, lifecycle hooks) 🔧 |
| `@rxdi/lit-html` | Lightweight Lit/Lit-HTML integration helpers, component decorators and modifier system for building web components ✨ |
| `@rxdi/router` | Client-side router with route guards, params and outlet/slot integration for web components 🚦 |
| `@rxdi/graphql` | Server GraphQL module for Hapi integrations and schema lifecycle helpers 🧩 |
| `@rxdi/graphql-client` | Apollo-based GraphQL client helpers and typed integration for components 💬 |
| `@rxdi/graphql-pubsub` | In-process pub/sub helpers for GraphQL subscriptions ⚡ |
| `@rxdi/graphql-pubsub-test` | Test helpers for GraphQL pubsub flows 🧪 |
| `@rxdi/graphql-rabbitmq-subscriptions` | RabbitMQ-backed pub/sub engine for distributed GraphQL subscriptions 🐇 |
| `@rxdi/rabbitmq-pubsub` | Low-level RabbitMQ pub/sub primitives used by RabbitMQ integrations 🛠️ |
| `@rxdi/hapi` | Hapi server integrations and helpers for running modules on Hapi 🎛️ |
| `@rxdi/http` | GraphQL-over-HTTP helpers and an HTTP client wrapper used by client modules 🌐 |
| `@rxdi/altair` | Altair GraphQL playground wrapper ready to serve via a route or static mount 🧭 |
| `@rxdi/firestore` | Reactive mixins and collection helpers for Google Firestore (server friendly) 🔥 |
| `@rxdi/neo4j` | Neo4j / neo4j-graphql-js helpers and automatic CRUD generation for typed GraphQL types 🌳 |
| `@rxdi/forms` | Reactive form binding for Lit/Lit-HTML components with validation and templates 📝 |
| `@rxdi/hotkeys` | Global and per-component hotkeys utilities for UI bindings ⌨️ |
| `@rxdi/compressor` | Small utilities for compressing/decompressing payloads (LZW) 🗜️ |
| `@rxdi/credit-card-form` | Reusable credit card component and model for forms 💳 |
| `@rxdi/parcel-plugin-shebang` | Parcel plugin to preserve shebangs when bundling CLI files ✂️ |
| `@rxdi/schematics` | Collection of Angular-style schematics for generating and scaffolding files ⚙️ |

> Tip: Each package includes its own README with examples (look in `packages/<name>/README.md`).

---

## Getting started — local development 🔧

Requirements
- Node.js (LTS recommended; repo uses modern TypeScript)
- npm (or a Node package manager) — this repo uses Bolt workspaces

Clone and install

```bash
git clone https://github.com/rxdi/mono.git
cd mono
npm install
```

Common workspace scripts (run from repo root):

- Install & bootstrap (already `npm install` handles this):
  - npx bolt will be available via `npx bolt`
- Run package scripts across the workspace:
  - Build all packages: `npx bolt ws exec -- npm run build`
  - Run tests for all packages: `npx bolt ws exec -- npm test`
  - Publish packages: `npx bolt ws exec -- npm publish --update-readme --access public`
  - Publish nightly: `npx bolt ws exec -- npm publish ... --tag nightly`

Run a single package locally

```bash
# from repo root
cd packages/<package-name>
# install package-local deps if needed
npm install
# run package's dev or build script (check package.json)
npm run dev || npm run start || npm run build
```

If you use `gapi` helper scripts (present in this repository):
- `gapi start --local --parcel` — run a dev build for a client app with Parcel
- `gapi build` — build bundles using the project's conventions

---

## Contributing 🤝

We welcome contributions! Please follow these steps:

1. Fork the repo and create a feature branch: `git checkout -b feat/your-change`
2. Add or update tests/examples in the package folder.
3. Run tests: `npx bolt ws exec -- npm test`
4. Commit with clear message and open a PR against `main`.

Please follow the code style in existing packages (TypeScript modern style + Prettier). Add short, focused changelog entries in `CHANGELOG.md` for package-level releases.

---

## Release & publishing notes 📤

- Releases are performed using workspace scripts in `package.json` (see `publish-packages` and `publish-packages-nightly`).
- Version bumps for packages can be done using the top-level scripts: `npm run patch|minor|major` which run workspace commands.

---

## License & Code of Conduct 📄

- Licensed under **MIT**. See `LICENSE` in the repo root.
- Please be respectful and open in contributions — follow common open source etiquette.

---

## Need help / Contact 💬

- Issues: https://github.com/rxdi/mono/issues
- Author: Kristiyan Tachev (@Stradivario)

---

Happy hacking — jump into `packages/` and try out a package! ✨

---

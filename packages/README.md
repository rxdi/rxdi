# Packages — Index

This folder contains a set of packages published under `@rxdi/*`.

Quick links and short descriptions (open any package to read full docs/examples):

- [altair](./altair/README.md) — Altair GraphQL playground wrapper
- [compressor](./compressor/README.md) — LZW compress/decompress utilities
- [core](./core/README.md) — Core DI container, bootstrap, modules, lifecycle hooks
- [credit-card-form](./credit-card-form/README.md) — Reusable credit-card form component
- [firestore](./firestore/README.md) — Firestore reactive mixins and collection helpers
- [forms](./forms/README.md) — Reactive form binding for Lit/Lit-HTML
- [graphql](./graphql/README.md) — Server GraphQL module for Hapi
- [graphql-client](./graphql-client/README.md) — Apollo client helpers & typed integration
- [graphql-pubsub](./graphql-pubsub/README.md) — In-process pub/sub helpers
- [graphql-pubsub-test](./graphql-pubsub-test/README.md) — Test helpers for pubsub flows
- [graphql-rabbitmq-subscriptions](./graphql-rabbitmq-subscriptions/README.md) — RabbitMQ engine for GraphQL subscriptions
- [hapi](./hapi/README.md) — Hapi integrations and helpers
- [hotkeys](./hotkeys/README.md) — Global/per-component hotkeys utilities
- [http](./http/README.md) — GraphQL-over-HTTP helpers
- [lit-html](./lit-html/README.md) — Lit/Lit-HTML helpers, modifiers, decorators
- [neo4j](./neo4j/README.md) — Neo4j helpers and automatic CRUD generation
- [parcel-plugin-shebang](./parcel-plugin-shebang/README.md) — Parcel plugin to preserve shebangs
- [rabbitmq-pubsub](./rabbitmq-pubsub/README.md) — RabbitMQ primitives for pub/sub
- [router](./router/README.md) — Client-side router for web components
- [schematics](./schematics/README.md) — Scaffolding tools and generators

Usage notes
- Open `packages/<name>/README.md` for installation, examples, and API notes.
- To run tests for a single package from repo root: `npx bolt ws exec --scope <package-name> -- npm test`.

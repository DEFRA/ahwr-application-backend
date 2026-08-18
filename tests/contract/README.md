# Contract tests (Pact)

Consumer-driven contract tests between `ahwr-backoffice-ui` (consumer) and `ahwr-application-backend` (provider), using [Pact](https://docs.pact.io/).

## Why this exists

Nothing in the existing test tiers catch a shape mismatch before both sides were deployed together:

- Unit tests mock the repository entirely
- Integration tests verify the backend against its own assumptions, not the UI's
- E2E tests only catch this once both sides are already deployed

Contract tests verify request/response shape agreement between the two services independently, in CI, before the changes are deployed.

## How it works

The consumer (`ahwr-backoffice-ui`) defines the contract — what requests it sends and what responses it expects. This generates a pact file (`pacts/ahwr-backoffice-ui-ahwr-application-backend.json`) which is committed directly in that repo, kept in sync with the test that generates it via a verify check (see that repo's `test/contract/README.md`).

This backend fetches that file in CI via `curl` and runs `verifyProvider()`, which replays each recorded interaction against the real running server and checks the responses match.

## Running locally

The pact file lives in the UI repo, not this one. To run locally, copy it from a sibling checkout:

```bash
cp ../ahwr-backoffice-ui/pacts/ahwr-backoffice-ui-ahwr-application-backend.json pacts/
npm run test:contract
```

If you don't have a sibling checkout, fetch it the same way CI does:

```bash
curl -fsSL \
  -o pacts/ahwr-backoffice-ui-ahwr-application-backend.json \
  https://raw.githubusercontent.com/DEFRA/ahwr-backoffice-ui/main/pacts/ahwr-backoffice-ui-ahwr-application-backend.json
npm run test:contract
```

Contract tests are excluded from `jest.config.cjs` (the default config used by `npm test` and `npx jest`), so `npx jest tests/contract` will find no tests. Use `npm run test:contract` instead — it uses `jest.contract.config.cjs` which targets `tests/contract/` explicitly.

## Structure

```
tests/contract/
  data/
    applications-seed.js   seed fixture for the applications collection
    claims-seed.js         seed fixture for the claims collection
  provider.pact.test.js
  README.md
```

Seed data uses sample values from Test env (claim REBC-DN1M-HS6D / application IAHW-5KHC-D7ZN), kept in sync with the consumer fixtures in `ahwr-backoffice-ui/test/contract/data/`.

## Design decisions worth knowing before extending this

**`server.start()` is required.** Integration tests use Hapi's `server.inject()` (in-process, no real HTTP). Pact's verifier makes real HTTP connections, so the server must be bound to a port. `createServer()` does not call `server.start()` — the contract test does it explicitly with `port: 0` so the OS assigns a free port.

**Messaging and distributed-job handlers are mocked.** Calling `server.start()` triggers the `start` event which invokes `startFcpMessagingService`, `configureAndStartMessaging`, and `runDistributedStartupJobInBackground`. These are not mocked in `test-utils.js` (integration tests never start the server so they never fire). The contract test mocks them directly to prevent connections to SQS and service bus.

**The `/api` prefix is added in `requestFilter`.** The UI's `applicationApiUri` config includes `/api` in production, so the consumer calls `/claims/search` relative to that base. The pact records it without the prefix. The `requestFilter` prepends `/api` to all non-internal requests before forwarding to the provider. Pact's own internal `/_pact*` routes are excluded from the rewrite.

**No Pact Broker — the committed file on `main` instead.** The pact file is committed directly in `ahwr-backoffice-ui` and fetched via `curl` against `raw.githubusercontent.com`. This is sufficient for a single consumer-provider pair without deployment gating needs; a real Pact Broker would be the answer if version-aware resolution (which consumer version is compatible with which provider version) is ever actually needed.

**Merge order matters for bootstrapping.** The UI PR must be merged first so the pact is committed on `main` before the backend CI tries to fetch it. Once both sides are live this is no longer a concern — the pact always exists.

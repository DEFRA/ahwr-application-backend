# Contract tests (Pact)

Consumer-driven contract tests between `ahwr-backoffice-ui` (consumer) and `ahwr-application-backend` (provider), using [Pact](https://docs.pact.io/).

## Why this exists

 Nothing in the existing test tiers catch a shape mismatch before both sides were deployed together:

- Unit tests mock the repository entirely
- Integration tests verify the backend against its own assumptions, not the UI's
- E2E tests only catch this once both sides are already deployed

Contract tests verify request/response shape agreement between the two services independently, in CI, before either side is deployed.

## How it works

The consumer (`ahwr-backoffice-ui`) defines the contract — what requests it sends and what responses it expects. This generates a pact file (`pacts/ahwr-backoffice-ui-ahwr-application-backend.json`) which is published as a GitHub Release asset tagged `pact-contracts` on the UI repo when its `main` branch is updated.

This backend downloads that file in CI and runs `verifyProvider()`, which replays each recorded interaction against the real running server and checks the responses match.

## Running locally

The pact file is not committed — it is downloaded by CI. To run locally, copy it from the UI repo first:

```bash
cp ../ahwr-backoffice-ui/pacts/ahwr-backoffice-ui-ahwr-application-backend.json pacts/
npx jest tests/contract --runInBand --no-coverage
```

## Structure

```
tests/contract/
  data/
    applications.js   seed fixture for the applications collection
    claims.js         seed fixture for the claims collection
  provider.pact.test.js
  README.md
```

Seed data uses real values from Test env (claim REBC-DN1M-HS6D / application IAHW-5KHC-D7ZN), kept in sync with the consumer fixtures in `ahwr-backoffice-ui/test/contract/data/`.

## Design decisions worth knowing before extending this

**`server.start()` is required.** Integration tests use Hapi's `server.inject()` (in-process, no real HTTP). Pact's verifier makes real HTTP connections, so the server must be bound to a port. `createServer()` does not call `server.start()` — the contract test does it explicitly with `port: 0` so the OS assigns a free port.

**Messaging and distributed-job handlers are mocked.** Calling `server.start()` triggers the `start` event which invokes `startFcpMessagingService`, `configureAndStartMessaging`, and `runDistributedStartupJobInBackground`. These are not mocked in `test-utils.js` (integration tests never start the server so they never fire). The contract test mocks them directly to prevent connections to SQS and service bus.

**The `/api` prefix is added in `requestFilter`.** The UI's `applicationApiUri` config includes `/api` in production, so the consumer calls `/claims/search` relative to that base. The pact records it without the prefix. The `requestFilter` prepends `/api` to all non-internal requests before forwarding to the provider. Pact's own internal `/_pact*` routes are excluded from the rewrite.

**No Pact Broker — GitHub Releases instead.** The pact file is shared via a rolling GitHub Release tagged `pact-contracts` on `ahwr-backoffice-ui`. This is sufficient for a single consumer-provider pair without deployment gating needs.

**Merge order matters for bootstrapping.** The UI PR must be merged first so the pact is published before the backend CI tries to download it. Once both sides are live this is no longer a concern — the pact always exists.

**Adding a new endpoint.** Add consumer interactions in `ahwr-backoffice-ui`. The UI merge publishes an updated pact. The backend's `verifyProvider()` picks up the new interactions automatically. The only backend change needed is additional seed data in `beforeAll` if the new endpoint requires data not already seeded.

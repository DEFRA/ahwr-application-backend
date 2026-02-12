# ahwr-application-backend

Created from the Core delivery platform Node.js Backend Template.

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Local development](#local-development)
  - [Setup](#setup)
  - [Development](#development)
  - [Testing](#testing)
  - [Production](#production)
  - [Npm scripts](#npm-scripts)
  - [Update dependencies](#update-dependencies)
  - [Formatting](#formatting)
    - [Windows prettier issue](#windows-prettier-issue)
- [API endpoints](#api-endpoints)
- [Development helpers](#development-helpers)
  - [MongoDB Locks](#mongodb-locks)
  - [Proxy](#proxy)
- [Docker](#docker)
  - [Development image](#development-image)
  - [Production image](#production-image)
  - [Docker Compose](#docker-compose)
  - [Dependabot](#dependabot)
  - [SonarCloud](#sonarcloud)
- [Licence](#licence)
  - [About the licence](#about-the-licence)

# Service Purpose

This service is the main backend for AHWR and handles the CRUD updates for applications, claims, herds and flags.
API endpoints are provided for the public and internal frontends to interact with the data.

# Service features

- Provides API endpoints for the public and internal frontends to interact with the data
- Processes incoming messages from an SQS queue to update the status of claims as needed
- Emits outbound events to various SNS topics to notify other services of changes to applications, claims, herds and flags
- Runs scheduled tasks to check for any claims that have been in a ON_HOLD status for over 24 hours and updates their status to READY_TO_PAY

## Requirements

### Node.js

Please install [Node.js](http://nodejs.org/) `>= v22` and [npm](https://nodejs.org/) `>= v11`. You will find it
easier to use the Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
cd ahwr-application-backend
nvm use
```

## Local development

### Setup

Install application dependencies:

```bash
npm install
```

### Development

To run the application in `development` mode run:

```bash
npm run dev
```

OR to run dockerised to mimic production environment run:

```bash
./scripts/start.sh
```

### Testing

To test the application run:

```bash
npm run test
```

### Npm scripts

All available Npm scripts can be seen in [package.json](./package.json).
To view them in your command line run:

```bash
npm run
```

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

### Formatting

#### Windows prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## API endpoints

| Endpoint                                               | Description                                                                         |
| :----------------------------------------------------- | :---------------------------------------------------------------------------------- |
| `GET: /health`                                         | Health                                                                              |
| `GET: /api/support/applications/{reference}`           | Request DB view of a given application, for support area in backoffice              |
| `GET: /api/support/claims/{reference}`                 | Request DB view of a given claim, for support area in backoffice                    |
| `GET: /api/support/herds/{id}`                         | Request DB view of a given herd, for support area in backoffice                     |
| `GET: /api/applications/{oldWorldAppRef}/history`      | Request history for a specific old world application                                |
| `GET: /api/claims/{claimRef}/history`                  | Request history for a specific claim                                                |
| `PUT: /api/applications/{ref}`                         | Update status of old world application. <Deprecated>                                |
| `GET: /api/applications/contact-history/{ref}`         | Request contact history for a specific application                                  |
| `PUT: /api/applications/contact-history`               | Potentially update contact history for a specific application                       |
| `GET: /api/applications/latest-contact-details/{ref}`  | Request latest contact details for an application                                   |
| `POST: /api/applications`                              | Create a new application                                                            |
| `GET: /api/applications`                               | Get all applications for a specific SBI                                             |
| `GET: /api/applications/{applicationReference}/claims` | Get all claims for a specific application                                           |
| `GET: /api/applications/{applicationReference}/herds`  | Get all herds for a specific application                                            |
| `GET: /api/applications/{applicationReference}`        | Get a specific application                                                          |
| `POST: /api/applications/search`                       | Search for applications using specific criteria                                     |
| `PUT: /api/applications/{reference}/data`              | Update data for a specific application                                              |
| `PUT: /api/applications/{ref}/eligible-pii-redaction`  | Update eligibility for PII redaction for a specific application                     |
| `GET: /api/claims/{reference}`                         | Get a specific claim by reference                                                   |
| `POST: /api/claims/search`                             | Search for claims using specific criteria                                           |
| `POST: /api/claims/is-urn-unique`                      | Check if the Unique reference has been used for any previous claims for a given SBI |
| `POST: /api/claims`                                    | Create a new claim                                                                  |
| `PUT: /api/claims/update-by-reference`                 | Update the status of a claim                                                        |
| `PUT: /api/claims/{reference}/data`                    | Update data for a specific claim                                                    |
| `PATCH: /api/flags/{flagId}/delete`                    | Mark a flag as deleted                                                              |
| `GET: /api/flags`                                      | Get all the lags that exist                                                         |
| `POST: /api/applications/{ref}/flag`                   | Create a new flag against the given application reference                           |
| `DELETE: /api/cleanup`                                 | Cleanup (delete) data for a given SBI, as used by performance tests etc             |

## Development helpers

### MongoDB Locks

If you require a write lock for Mongo you can acquire it via `server.locker` or `request.locker`:

```javascript
async function doStuff(server) {
  const lock = await server.locker.lock('unique-resource-name')

  if (!lock) {
    // Lock unavailable
    return
  }

  try {
    // do stuff
  } finally {
    await lock.free()
  }
}
```

Keep it small and atomic.

You may use **using** for the lock resource management.
Note test coverage reports do not like that syntax.

```javascript
async function doStuff(server) {
  await using lock = await server.locker.lock('unique-resource-name')

  if (!lock) {
    // Lock unavailable
    return
  }

  // do stuff

  // lock automatically released
}
```

Helper methods are also available in `/src/helpers/mongo-lock.js`.

### Proxy

We are using forward-proxy which is set up by default. To make use of this: `import { fetch } from 'undici'` then
because of the `setGlobalDispatcher(new ProxyAgent(proxyUrl))` calls will use the ProxyAgent Dispatcher

If you are not using Wreck, Axios or Undici or a similar http that uses `Request`. Then you may have to provide the
proxy dispatcher:

To add the dispatcher to your own client:

```javascript
import { ProxyAgent } from 'undici'

return await fetch(url, {
  dispatcher: new ProxyAgent({
    uri: proxyUrl,
    keepAliveTimeout: 10,
    keepAliveMaxTimeout: 10
  })
})
```

## Docker

### Development image

Build:

```bash
docker build --target development --no-cache --tag ahwr-application-backend:development .
```

Run:

```bash
docker run -e PORT=3001 -p 3001:3001 ahwr-application-backend:development
```

### Production image

Build:

```bash
docker build --no-cache --tag ahwr-application-backend .
```

Run:

```bash
docker run -e PORT=3001 -p 3001:3001 ahwr-application-backend
```

### Docker Compose

A local environment with:

- Localstack for AWS services (S3, SQS)
- MongoDB
- This service.

```bash
docker compose up --build -d
```

### Dependabot

We have added an example dependabot configuration file to the repository. You can enable it by renaming
the [.github/example.dependabot.yml](.github/example.dependabot.yml) to `.github/dependabot.yml`

### SonarCloud

Sonarcoud is enabled for this repository. All pull requests will be analysed.
You can view the reports at [Sonarcloud](https://sonarcloud.io/project/overview?id=DEFRA_ahwr-application-backend)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.

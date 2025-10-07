import convict from 'convict'
import convictFormatWithValidator from 'convict-format-with-validator'

import { convictValidateMongoUri } from './common/helpers/convict/validate-mongo-uri.js'

convict.addFormat(convictValidateMongoUri)
convict.addFormats(convictFormatWithValidator)

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

const config = convict({
  serviceVersion: {
    doc: 'The service version, this variable is injected into your docker container in CDP environments',
    format: String,
    nullable: true,
    default: null,
    env: 'SERVICE_VERSION'
  },
  host: {
    doc: 'The IP address to bind',
    format: 'ipaddress',
    default: '0.0.0.0',
    env: 'HOST'
  },
  port: {
    doc: 'The port to bind',
    format: 'port',
    default: 3001,
    env: 'PORT'
  },
  serviceName: {
    doc: 'Api Service Name',
    format: String,
    default: 'ahwr-application-backend'
  },
  cdpEnvironment: {
    doc: 'The CDP environment the app is running in. With the addition of "local" for local development',
    format: [
      'local',
      'infra-dev',
      'management',
      'dev',
      'test',
      'perf-test',
      'ext-test',
      'prod'
    ],
    default: 'local',
    env: 'ENVIRONMENT'
  },
  log: {
    isEnabled: {
      doc: 'Is logging enabled',
      format: Boolean,
      default: !isTest,
      env: 'LOG_ENABLED'
    },
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Format to output logs in',
      format: ['ecs', 'pino-pretty'],
      default: isProduction ? 'ecs' : 'pino-pretty',
      env: 'LOG_FORMAT'
    },
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? ['req.headers.authorization', 'req.headers.cookie', 'res.headers']
        : ['req', 'res', 'responseTime']
    }
  },
  mongo: {
    mongoUrl: {
      doc: 'URI for mongodb',
      format: String,
      default: 'mongodb://127.0.0.1:27017/',
      env: 'MONGO_URI'
    },
    databaseName: {
      doc: 'database for mongodb',
      format: String,
      default: 'ahwr-application-backend',
      env: 'MONGO_DATABASE'
    },
    mongoOptions: {
      retryWrites: {
        doc: 'enable mongo write retries',
        format: Boolean,
        default: false
      },
      readPreference: {
        doc: 'mongo read preference',
        format: [
          'primary',
          'primaryPreferred',
          'secondary',
          'secondaryPreferred',
          'nearest'
        ],
        default: 'secondary'
      }
    }
  },
  httpProxy: {
    doc: 'HTTP Proxy URL',
    format: String,
    nullable: true,
    default: null,
    env: 'HTTP_PROXY'
  },
  isMetricsEnabled: {
    doc: 'Enable metrics reporting',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_METRICS'
  },
  tracing: {
    header: {
      doc: 'CDP tracing header name',
      format: String,
      default: 'x-cdp-request-id',
      env: 'TRACING_HEADER'
    }
  },
  application: {
    queueUrl: {
      doc: 'Application backend queue url',
      format: String,
      default: '',
      env: 'APPLICATION_BACKEND_QUEUE_URL'
    }
  },
  azure: {
    eventQueue: {
      uri: {
        doc: 'URI for AWHR event service bus queue',
        format: String,
        default: '',
        env: 'FCP_AHWR_EVENT_QUEUE_URI'
      },
      ttl: {
        doc: 'Time to live for AWHR event access token',
        format: 'nat',
        default: 86400,
        env: 'FCP_AHWR_EVENT_QUEUE_TTL'
      },
      keyName: {
        doc: 'Key name for AWHR event service bus',
        format: String,
        default: 'LogicAppsAccessKey',
        env: 'FCP_AHWR_EVENT_QUEUE_SA_KEY_NAME'
      },
      key: {
        doc: 'Key for AWHR event service bus',
        format: String,
        default: 'my_key',
        sensitive: true,
        env: 'FCP_AHWR_EVENT_QUEUE_SA_KEY'
      },
      address: {
        doc: 'foo',
        format: String,
        default: 'ffc-ahwr-event-dev',
        env: 'EVENT_QUEUE_ADDRESS'
      },
      host: {
        doc: 'foo',
        format: String,
        default: '',
        env: 'MESSAGE_QUEUE_HOST'
      },
      password: {
        doc: 'foo',
        format: String,
        default: '',
        env: 'FCP_AHWR_EVENT_QUEUE_SA_KEY'
      },
      username: {
        doc: 'foo',
        format: String,
        default: '',
        env: 'MESSAGE_QUEUE_USER'
      },
      connection: {
        doc: 'foo',
        format: String,
        default: 'my_connection_string',
        sensitive: true,
        env: 'QUEUE_CONNECTION_STRING'
      }
    }
  }
})

config.validate({ allowed: 'strict' })

export { config }

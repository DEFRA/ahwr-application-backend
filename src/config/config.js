import convict from 'convict'
import convictFormatWithValidator from 'convict-format-with-validator'

import { convictValidateMongoUri } from './convict/validate-mongo-uri.js'

convict.addFormat(convictValidateMongoUri)
convict.addFormats(convictFormatWithValidator)

const isProduction = process.env.NODE_ENV === 'production'
const usePrettyPrint = process.env.USE_PRETTY_PRINT === 'true'
const msgTypePrefix = 'uk.gov.ffc.ahwr'

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
  uris: {
    documentGeneratorApiUri: {
      doc: 'Api Uri for Document Generator Service',
      format: String,
      default: 'http://localhost:3002',
      env: 'DOCUMENT_GENERATOR_SERVICE_URI'
    },
    sfdMessagingProxyApiUri: {
      doc: 'Api Uri for Sfd Mesaging Proxy Service',
      format: String,
      default: 'http://localhost:3002',
      env: 'SFD_MESSAGING_PROXY_SERVICE_URI'
    },
    messageGeneratorApiUri: {
      doc: 'Api Uri for Message Generator Service',
      format: String,
      default: 'http://localhost:3002',
      env: 'MESSAGE_GENERATOR_SERVICE_URI'
    }
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
  env: {
    doc: 'The Node environment',
    format: ['development', 'test', 'production'],
    default: 'development',
    env: 'NODE_ENV'
  },
  isDev: {
    doc: 'The Node environment',
    format: Boolean,
    default: process.env.NODE_ENV === 'development'
  },
  log: {
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Format to output logs in',
      format: ['ecs', 'pino-pretty'],
      default: usePrettyPrint ? 'pino-pretty' : 'ecs',
      env: 'LOG_FORMAT'
    },
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers',
            'payload.vetsName',
            'payload.vetRCVSNumber'
          ]
        : []
    }
  },
  messageTypes: {
    applicationRequestMsgType: {
      doc: 'Message type for application requests',
      format: String,
      default: `${msgTypePrefix}.app.request`
    },
    applicationResponseMsgType: {
      doc: 'Message type for application responses',
      format: String,
      default: `${msgTypePrefix}.app.response`
    },
    applicationEmailDocRequestMsgType: {
      doc: 'Message type for email doc requests',
      format: String,
      default: `${msgTypePrefix}.app.email.doc.request`
    },
    moveClaimToPaidMsgType: {
      doc: 'Message type for claim to paid',
      format: String,
      default: `${msgTypePrefix}.set.paid.status`
    },
    redactPiiRequestMsgType: {
      doc: 'Message type for pii redaction requests',
      format: String,
      default: `${msgTypePrefix}.redact.pii.request`
    },
    submitPaymentRequestMsgType: {
      doc: 'Message type for payment requests',
      format: String,
      default: `${msgTypePrefix}.submit.payment.request`
    },
    sfdRequestMsgType: {
      doc: 'Message type for sfd requests',
      format: String,
      default: `${msgTypePrefix}.sfd.request`
    },
    messageGeneratorMsgType: {
      doc: 'Message type for claim status update requests',
      format: String,
      default: `${msgTypePrefix}.claim.status.update`
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
        default: 'primaryPreferred'
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
  complianceCheckRatio: {
    doc: 'Ratio value used to determine how many claims to check for compliance',
    format: Number,
    default: 1,
    env: 'CLAIM_COMPLIANCE_CHECK_RATIO'
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
  },
  multiHerds: {
    releaseDate: {
      doc: 'Release date for go live of multi herds feature',
      format: String,
      default: '2025-05-01',
      env: 'MULTI_HERDS_RELEASE_DATE'
    }
  },
  featureAssurance: {
    enabled: {
      doc: 'Feature assurance enabled',
      format: Boolean,
      default: process.env.FEATURE_ASSURANCE_ENABLED === 'true'
    },
    startDate: {
      doc: 'Release date for go live of multi herds feature',
      format: String,
      default: null,
      nullable: true,
      env: 'FEATURE_ASSURANCE_START'
    }
  }
})

config.validate({ allowed: 'strict' })

export { config }

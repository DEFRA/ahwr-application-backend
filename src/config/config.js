import convict from 'convict'
import convictFormatWithValidator from 'convict-format-with-validator'
import { convictValidateMongoUri } from './convict/validate-mongo-uri.js'

convict.addFormat(convictValidateMongoUri)
convict.addFormats(convictFormatWithValidator)

const isProduction = process.env.NODE_ENV === 'production'
const usePrettyPrint = process.env.USE_PRETTY_PRINT === 'true'
const msgTypePrefix = 'uk.gov.ffc.ahwr'
const defaultServiceUri = 'http://localhost:3002'
const defaultApiKey = 'c19fcb0d-a6d2-4d9e-9325-16d44ddc0724'

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
  apiKeys: {
    publicUiApiKey: {
      doc: 'Api key for the public ui',
      format: String,
      default: defaultApiKey,
      sensitive: true,
      env: 'PUBLIC_UI_API_KEY'
    },
    backofficeUiApiKey: {
      doc: 'Api key for the backoffice',
      format: String,
      default: defaultApiKey,
      sensitive: true,
      env: 'BACKOFFICE_UI_API_KEY'
    },
    messageGeneratorApiKey: {
      doc: 'Api key for the message generator',
      format: String,
      default: defaultApiKey,
      sensitive: true,
      env: 'MESSAGE_GENERATOR_API_KEY'
    }
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
      default: defaultServiceUri,
      env: 'DOCUMENT_GENERATOR_SERVICE_URI'
    },
    sfdMessagingProxyApiUri: {
      doc: 'Api Uri for Sfd Mesaging Proxy Service',
      format: String,
      default: defaultServiceUri,
      env: 'SFD_MESSAGING_PROXY_SERVICE_URI'
    },
    messageGeneratorApiUri: {
      doc: 'Api Uri for Message Generator Service',
      format: String,
      default: defaultServiceUri,
      env: 'MESSAGE_GENERATOR_SERVICE_URI'
    }
  },
  cdpEnvironment: {
    doc: 'The CDP environment the app is running in. With the addition of "local" for local development',
    format: ['local', 'infra-dev', 'management', 'dev', 'test', 'perf-test', 'ext-test', 'prod'],
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
    applicationDocRequestMsgType: {
      doc: 'Message type for document generate requests',
      format: String,
      default: `${msgTypePrefix}.app.doc.request`
    },
    moveClaimToPaidMsgType: {
      doc: 'Message type for claim to paid',
      format: String,
      default: `${msgTypePrefix}.set.paid.status`
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
    },
    messageGeneratorMsgTypeReminder: {
      doc: 'Message-Generator message type for reminder email requests',
      format: String,
      default: `${msgTypePrefix}.agreement.reminder.email`
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
        format: ['primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', 'nearest'],
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
  sns: {
    documentRequestedTopicArn: {
      doc: 'ARN of the topic to send document requested events to',
      format: String,
      default: '#',
      env: 'DOCUMENT_REQUEST_TOPIC_ARN'
    },
    reminderRequestedTopicArn: {
      doc: 'ARN of the topic to send reminder requested events to',
      format: String,
      default: '#',
      env: 'REMINDER_REQUEST_TOPIC_ARN'
    },
    statusChangeTopicArn: {
      doc: 'ARN of the topic to send status change events to',
      format: String,
      default: '#',
      env: 'STATUS_CHANGE_TOPIC_ARN'
    },
    paymentRequestTopicArn: {
      doc: 'ARN of the topic to send payment request events to',
      format: String,
      default: '#',
      env: 'PAYMENT_REQUEST_TOPIC_ARN'
    }
  },
  aws: {
    region: {
      doc: 'AWS region',
      format: String,
      default: 'eu-west-1',
      env: 'AWS_REGION'
    },
    endpointUrl: {
      doc: 'AWS endpoint URL',
      format: String,
      default: null,
      nullable: true,
      env: 'AWS_ENDPOINT_URL'
    }
  },
  sqs: {
    applicationRequestQueueUrl: {
      doc: 'URL of the SQS queue to receive application requests from',
      format: String,
      default: '#',
      env: 'APPLICATION_BACKEND_QUEUE_URL'
    }
  },
  azure: {
    eventQueue: {
      address: {
        doc: 'Queue name to send AHWR events to',
        format: String,
        default: 'ffc-ahwr-event-dev',
        env: 'EVENT_QUEUE_ADDRESS'
      },
      host: {
        doc: 'Host used for the event message queue',
        format: String,
        default: '',
        env: 'MESSAGE_QUEUE_HOST'
      },
      password: {
        doc: 'Password to connect to Service bus instance',
        format: String,
        default: '',
        env: 'FCP_AHWR_EVENT_QUEUE_SA_KEY'
      },
      username: {
        doc: 'Username to connect to Service bus instance',
        format: String,
        default: '',
        env: 'MESSAGE_QUEUE_USER'
      }
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
  },
  reminderEmailMaxBatchSize: {
    doc: 'Reminder email, maximum number of agreements processed in single run.',
    format: Number,
    default: 5000,
    env: 'REMINDER_EMAIL_MAX_BATCH_SIZE'
  },
  scheduledJobs: {
    processOnHoldSchedule: {
      doc: 'Schedule on which to process on hold claims',
      format: String,
      default: !isProduction && '*/2 * * * *',
      env: 'PROCESS_ON_HOLD_SCHEDULE'
    },
    dataRedactionEnabled: {
      doc: 'Data redaction scheduled job is enabled',
      format: Boolean,
      default: process.env.DATA_REDACTION_SCHEDULED_JOB_ENABLED === 'true'
    },
    dataRedactionSchedule: {
      doc: 'Schedule on which to process data redaction',
      format: String,
      env: 'DATA_REDACTION_SCHEDULE',
      nullable: true,
      default: null
    },
    reminderEmailsEnabled: {
      doc: 'Reminder emails scheduled job is enabled',
      format: Boolean,
      default: process.env.REMINDER_EMAILS_SCHEDULED_JOB_ENABLED === 'true'
    },
    reminderEmailsSchedule: {
      doc: 'Schedule on which to send out reminder emails',
      format: String,
      env: 'REMINDER_EMAILS_SCHEDULE',
      nullable: true,
      default: null
    }
  }
})

config.validate({ allowed: 'strict' })

export { config }

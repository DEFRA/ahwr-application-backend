import { Pulse } from '@pulsecron/pulse'
import { config } from '../config/config.js'
import { isTodayHoliday } from '../lib/date-utils.js'
import { processOnHoldClaims } from './process-on-hold.js'
import { getLogger } from '../logging/logger.js'
import { processReminderEmailRequest } from '../messaging/application/process-reminder-email.js'
import { processRedactPiiRequest } from '../messaging/application/process-redact-pii.js'
import { metricsCounter } from '../common/helpers/metrics.js'

const jobs = {
  PROCESS_ON_HOLD_CLAIMS: {
    enabled: true,
    name: 'process on hold claims',
    schedule: config.get('scheduledJobs.processOnHoldSchedule')
  },
  DATA_REDACTION: {
    enabled: config.get('scheduledJobs.dataRedactionEnabled'),
    name: 'data redaction',
    schedule: config.get('scheduledJobs.dataRedactionSchedule')
  },
  REMINDER_EMAILS: {
    enabled: config.get('scheduledJobs.reminderEmailsEnabled'),
    name: 'reminder emails',
    schedule: config.get('scheduledJobs.reminderEmailsSchedule')
  }
}

const buildMongoUri = () => {
  const mongoUri = config.get('mongo.mongoUrl')
  const dbName = config.get('mongo.databaseName')

  if (mongoUri.includes('/admin')) {
    const replacedUri = mongoUri.replace('/admin', `/${dbName}`)

    return replacedUri
  }

  return `${mongoUri}${dbName}`
}

const emitMetricEvent = async (jobName) => {
  const formattedJobName = jobName.replaceAll(' ', '-')
  await metricsCounter(`scheduledjobs_${formattedJobName}`)
}

const pulse = new Pulse(
  {
    db: {
      address: buildMongoUri(),
      collection: 'scheduledjobs'
    }
  },
  (error, collection) => {
    if (error) {
      getLogger().error(`Pulse Mongo connection error: ${error}`)
    } else {
      getLogger().info(`Pulse connected to collection: ${collection.collectionName}`)
    }
  }
)

let dbClient

export const setDbClient = (client) => {
  dbClient = client
}

const lockLifetime = 120000 // 2 minutes in ms
const backoffDelay = 30000 // 30 seconds in ms

const defaultJobSettings = {
  lockLifetime,
  priority: 'high',
  attempts: 4,
  backoff: { type: 'exponential', delay: backoffDelay },
  shouldSaveResult: false
}

pulse.define(
  jobs.PROCESS_ON_HOLD_CLAIMS.name,
  async (job) => {
    await emitMetricEvent(job.attrs.name)
    const todayIsHoliday = await isTodayHoliday()

    if (todayIsHoliday) {
      getLogger().info('NOT processing on hold claims as today is holiday.')
    } else {
      getLogger().info('Processing on hold claims...')
      await processOnHoldClaims(dbClient)
    }
  },
  defaultJobSettings
)

if (jobs.DATA_REDACTION.enabled) {
  pulse.define(
    jobs.DATA_REDACTION.name,
    async (job) => {
      await emitMetricEvent(job.attrs.name)
      getLogger().info('Starting data redaction scheduled job...')
      const logger = getLogger()
      const message = { requestedDate: new Date() }
      await processRedactPiiRequest(message, logger)
    },
    defaultJobSettings
  )
}

if (jobs.REMINDER_EMAILS.enabled) {
  pulse.define(
    jobs.REMINDER_EMAILS.name,
    async (job) => {
      await emitMetricEvent(job.attrs.name)
      getLogger().info('Starting reminder emails scheduled job...')
      const message = { requestedDate: new Date(), maxBatchSize: 5000 }
      const logger = getLogger()
      await processReminderEmailRequest(message, dbClient, logger)
    },
    defaultJobSettings
  )
}

pulse.on('start', (job) => {
  getLogger().info(`Job <${job.attrs.name}> starting at ${time()}`)
})

pulse.on('success', (job) => {
  getLogger().info(`Job <${job.attrs.name}> succeeded at ${time()}`)
})

pulse.on('fail', async (error, job) => {
  getLogger().error(error, `Job <${job.attrs.name}> failed at ${time()}`)
  await emitMetricEvent(`${job.attrs.name}_failed`)
})

function time() {
  return new Date().toTimeString().split(' ')[0]
}

export const startPulseScheduling = async (databaseClient) => {
  setDbClient(databaseClient)
  getLogger().info('Starting Pulse scheduling...')
  await pulse.start()

  let enabledJobCount = 0

  if (jobs.PROCESS_ON_HOLD_CLAIMS.enabled) {
    await pulse.every(jobs.PROCESS_ON_HOLD_CLAIMS.schedule, jobs.PROCESS_ON_HOLD_CLAIMS.name)
    enabledJobCount += 1
  }

  if (jobs.REMINDER_EMAILS.enabled) {
    await pulse.every(jobs.REMINDER_EMAILS.schedule, jobs.REMINDER_EMAILS.name)
    enabledJobCount += 1
  }

  if (jobs.DATA_REDACTION.enabled) {
    await pulse.every(jobs.DATA_REDACTION.schedule, jobs.DATA_REDACTION.name)
    enabledJobCount += 1
  }

  getLogger().info(`Pulse started and ${enabledJobCount} job(s) scheduled`)
}

export const stopPulseScheduling = async () => {
  await pulse.stop()
  getLogger().info('Pulse stopped')
}

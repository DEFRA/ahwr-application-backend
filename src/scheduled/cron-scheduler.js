import { Pulse } from '@pulsecron/pulse'
import { config } from '../config/config.js'
import { isTodayHoliday } from '../lib/date-utils.js'
import { processOnHoldClaims } from './process-on-hold.js'
import { getLogger } from '../logging/logger.js'

const jobs = {
  PROCESS_ON_HOLD_CLAIMS: 'process on hold claims'
}

const pulse = new Pulse(
  {
    db: {
      address: config.get('mongo.mongoUrl'),
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

pulse.define(
  jobs.PROCESS_ON_HOLD_CLAIMS,
  async (_job) => {
    const todayIsHoliday = await isTodayHoliday()

    if (todayIsHoliday) {
      getLogger().info('NOT processing on hold claims as today is holiday.')
    } else {
      getLogger().info('Processing on hold claims...')
      await processOnHoldClaims(dbClient)
    }
  },
  {
    lockLifetime,
    priority: 'high',
    attempts: 4,
    backoff: { type: 'exponential', delay: backoffDelay },
    shouldSaveResult: false
  }
)

pulse.on('start', (job) => {
  getLogger().info(`Job <${job.attrs.name}> starting at ${time()}`)
})

pulse.on('success', (job) => {
  getLogger().info(`Job <${job.attrs.name}> succeeded at ${time()}`)
})

pulse.on('fail', (error, job) => {
  getLogger().error(error, `Job <${job.attrs.name}> failed at ${time()}`)
})

function time() {
  return new Date().toTimeString().split(' ')[0]
}

export const startPulseScheduling = async (databaseClient) => {
  getLogger().info('Starting Pulse scheduling...')
  await pulse.start()
  await pulse.every(config.get('scheduledJobs.processOnHold'), jobs.PROCESS_ON_HOLD_CLAIMS)

  setDbClient(databaseClient)
  getLogger().info(`Pulse started and ${Object.keys(jobs).length} job(s) scheduled`)
}

export const stopPulseScheduling = async () => {
  await pulse.stop()
  getLogger().info('Pulse stopped')
}

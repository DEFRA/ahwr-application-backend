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
      console.error('Pulse Mongo connection error:', error)
    } else {
      getLogger().info('Pulse connected to collection:', collection.collectionName)
    }
  }
)

let dbClient

export const setDbClient = (client) => {
  dbClient = client
}

pulse.define(
  jobs.PROCESS_ON_HOLD_CLAIMS,
  async (_job) => {
    const todayIsHoliday = await isTodayHoliday()

    if (!todayIsHoliday) {
      getLogger().info('Processing on hold claims...')
      await processOnHoldClaims(dbClient)
    } else {
      getLogger().info('NOT processing on hold claims as today is holiday.')
    }
  },
  {
    lockLifetime: 2 * 60 * 1000, // 2 minutes
    priority: 'high',
    attempts: 4,
    backoff: { type: 'exponential', delay: 30 * 1000 },
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
  getLogger().info(`Job <${job.attrs.name}> failed at ${time()}`, error)
})

function time() {
  return new Date().toTimeString().split(' ')[0]
}

export const startPulseScheduling = async (dbClient) => {
  getLogger().info('Starting Pulse scheduling...')
  await pulse.start()
  await pulse.every(config.get('scheduledJobs.processOnHold'), jobs.PROCESS_ON_HOLD_CLAIMS)

  setDbClient(dbClient)
  getLogger().info(`Pulse started and ${Object.keys(jobs).length} job(s) scheduled`)
}

export const stopPulseScheduling = async () => {
  await pulse.stop()
  getLogger().info('Pulse stopped')
}

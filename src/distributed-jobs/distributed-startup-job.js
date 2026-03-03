import { config } from '../config/config.js'
import {
  datastoreUpdates as v0690DatastoreUpdates,
  sendEvents as v0690SendEvents
} from './data-changes/v0690-data-changes.js'

export const runDistributedStartupJobInBackground = async (db, logger) => {
  try {
    await runDistributedStartupJob(db, logger.child({}))
  } catch (error) {
    logger.error(error, 'Distributed startup job error')
  }
}

export const runDistributedStartupJob = async (db, logger) => {
  const environmentsJobWillRun = ['local', 'dev', 'prod']
  const environment = config.get('cdpEnvironment')

  if (!environmentsJobWillRun.includes(environment)) {
    return
  }

  const serviceVersion = config.get('serviceVersion')
  const supportingDataConfigKey = `distributedJobs.v${serviceVersion.replaceAll('.', '')}SupportingData`
  const supportingData = config.get(supportingDataConfigKey)

  if (Object.keys(supportingData).length === 0) {
    throw new Error(`Missing supporting data for service version ${serviceVersion}`)
  }

  const hasAlreadyRun = await hasStartupJobAlreadyRun(serviceVersion, environmentsJobWillRun, db)
  if (hasAlreadyRun) {
    return
  }

  logger.info(`Running distributed job, service version ${serviceVersion}`)
  await performDataChanges(serviceVersion, supportingData, db, logger)
}

const hasStartupJobAlreadyRun = async (serviceVersion, environmentsJobWillRun, db) => {
  let hasRun

  try {
    await db.collection('distributed-job-locks').insertOne({
      _id: serviceVersion,
      type: 'startup',
      environments: environmentsJobWillRun,
      lockedAt: new Date()
    })

    hasRun = false
  } catch (e) {
    hasRun = true
  }

  return hasRun
}

const performDataChanges = async (serviceVersion, supportingData, db, logger) => {
  if (serviceVersion === '0.69.0') {
    await v0690DatastoreUpdates(serviceVersion, supportingData, db, logger)
    await v0690SendEvents(serviceVersion, supportingData, logger)
  } else {
    logger.info(`No data changes found for service version ${serviceVersion}`)
  }
}

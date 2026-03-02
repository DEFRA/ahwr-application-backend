import { config } from '../config/config.js'
import { v0680DatastoreUpdates, v0680SendEvents } from './data-changes/v0680-data-changes.js'

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

export const runDistributedStartupJob = async (db, logger) => {
  const environmentsJobWillRun = ['local', 'dev', 'prod']
  const environment = config.get('cdpEnvironment')

  if (!environmentsJobWillRun.includes(environment)) {
    return
  }

  const serviceVersion = config.get('serviceVersion')
  const supportingDataConfigKey = `distributedJobs.v${serviceVersion.replace(/\./g, '')}SupportingData`
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

const performDataChanges = async (serviceVersion, supportingData, db, logger) => {
  if (serviceVersion === '0.68.0') {
    await v0680DatastoreUpdates(serviceVersion, supportingData, db, logger)
    await v0680SendEvents(serviceVersion, supportingData, logger)
  } else if (serviceVersion === '0.68.1') {
    await v0680SendEvents(serviceVersion, supportingData, logger)
  } else {
    logger.info(`No data changes found for service version ${serviceVersion}`)
  }
}

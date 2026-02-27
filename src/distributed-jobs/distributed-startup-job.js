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
  const serviceVersion = config.get('serviceVersion')

  if (!environmentsJobWillRun.includes(environment)) {
    return
  }

  const hasAlreadyRun = await hasStartupJobAlreadyRun(serviceVersion, environmentsJobWillRun, db)
  if (hasAlreadyRun) {
    return
  }

  logger.info(`Running distributed job, service version ${serviceVersion}`)
  await performDataChanges(serviceVersion, db, logger)
}

const performDataChanges = async (serviceVersion, db, logger) => {
  if (serviceVersion === '0.68.0') {
    const v0680SupportingData = config.get('distributedJobs.v0680SupportingData')
    await v0680DatastoreUpdates(v0680SupportingData, serviceVersion, db, logger)
    await v0680SendEvents(v0680SupportingData, serviceVersion, logger)
  }
}

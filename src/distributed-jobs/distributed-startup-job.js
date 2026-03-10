import { config } from '../config/config.js'
import {
  updateDatastore as v0692DatastoreUpdates,
  sendEvents as v0692SendEvents
} from './data-changes/v0692-data-changes.js'

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
  const supportingDataVersion = `v${serviceVersion?.replaceAll('.', '')}SupportingData`
  const supportingDataConfigKey = `distributedJobs.${supportingDataVersion}`

  if (isNotDataChangeVersion(supportingDataVersion)) {
    return
  }

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

const isNotDataChangeVersion = (configKey) => {
  const schema = config.getProperties().distributedJobs
  return !(configKey in schema)
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
  if (serviceVersion === '0.69.2') {
    await v0692DatastoreUpdates(serviceVersion, supportingData, db, logger)
    await v0692SendEvents(serviceVersion, supportingData, logger)
  } else {
    logger.info(`No data changes found for service version ${serviceVersion}`)
  }
}

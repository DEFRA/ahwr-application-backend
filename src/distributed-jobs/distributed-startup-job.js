import { config } from '../config/config.js'
import { processChanges } from './data-changes/process_changes.js'

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

  const supportingDataConfigKey = `distributedJobs.supportingData`

  /** @type {{ data: Array, version: string } | null | undefined} */
  const dataChanges = config.get(supportingDataConfigKey)

  if (dataChanges === null || dataChanges === undefined || Object.keys(dataChanges).length === 0) {
    logger.info('No data changes')
    return
  }

  const data = dataChanges?.data ?? []
  const version = dataChanges?.version

  if (!version) {
    throw new Error(`There is no version of the data`)
  }

  if (Array.isArray(data) && data.length === 0) {
    throw new Error(`Missing supporting data for data change version ${version}`)
  }

  const hasAlreadyRun = await hasStartupJobAlreadyRun(version, environmentsJobWillRun, db)
  if (hasAlreadyRun) {
    return
  }

  logger.info(`Running distributed job, data change version ${version}`)
  await processChanges(data, db, logger)
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

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

  if (dataChanges === null || dataChanges === undefined) {
    return
  }

  const supportingData = dataChanges?.data ?? []
  const supportingVersion = dataChanges?.version

  if (supportingVersion === null || supportingVersion === undefined) {
    throw new Error(`There is no version of the data`)
  }

  if (Object.keys(supportingData).length === 0) {
    throw new Error(`Missing supporting data for data change version ${supportingVersion}`)
  }

  const hasAlreadyRun = await hasStartupJobAlreadyRun(supportingVersion, environmentsJobWillRun, db)
  if (hasAlreadyRun) {
    return
  }

  logger.info(`Running distributed job, service version ${supportingVersion}`)
  await processChanges(supportingData, db, logger)
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

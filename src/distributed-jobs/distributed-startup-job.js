import { config } from '../config/config.js'
import { updateHerdName } from '../repositories/herd-repository.js'
import {
  removeHerdFromClaimData,
  updateHerdNameInClaimData
} from '../repositories/claim-repository.js'
import { raiseHerdEvent } from '../event-publisher/index.js'

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
  const environmentsJobWillRun = ['development', 'production']
  const environment = config.get('env')
  const serviceVersion = config.get('serviceVersion')

  const hasAlreadyRun = await hasStartupJobAlreadyRun(serviceVersion, environmentsJobWillRun, db)
  if (hasAlreadyRun) {
    return
  }

  logger.info(`Running distributed startup job for: service version (${serviceVersion}) environments [${environmentsJobWillRun}]`)
  if (environmentsJobWillRun.includes(environment)) {
    await performDataChanges(serviceVersion, db, logger)
  }
}

const performDataChanges = async (serviceVersion, db, logger) => {
  if (serviceVersion === '0.68.0') {
    const v0680SupportingData = config.get('distributedJobs.v0680SupportingData')
    await v0680DatastoreUpdates(v0680SupportingData, serviceVersion, db, logger)
    await v0680SendEvents(v0680SupportingData, serviceVersion, db, logger)
  }
}

const v0680DatastoreUpdates = async ({ datastoreUpdates }, serviceVersion, db, logger) => {
  logger.info(`Running datastore updates for service versionAaron: ${serviceVersion}`)

  const update1 = datastoreUpdates[0]
  await removeHerdFromClaimData({
    claimRef: update1.claimRef,
    oldClaimHerdName: 'Mule Flock',
    updateNotes: 'Requested change from Samantha Smith via email on 11th February 2026',
    updatedBy: 'Admin2',
    db
  })

  const update2 = datastoreUpdates[1]
  await removeHerdFromClaimData({
    claimRef: update2.claimRef,
    oldClaimHerdName: 'Mule Flock',
    updateNotes: 'Requested change from Samantha Smith via email on 11th February 2026',
    updatedBy: 'Admin2',
    db
  })

  const update3 = datastoreUpdates[2]
  await updateHerdName({
    id: update3.id,
    version: 1,
    name: 'Commercial Flock',
    updatedBy: 'Admin2',
    db
  })
  const update4 = datastoreUpdates[3]
  await updateHerdNameInClaimData({
    claimRef: update4.claimRef,
    newClaimHerdName: 'Commercial Flock',
    oldClaimHerdName: 'Mule Flock',
    updateNotes: 'Requested change from Samantha Smith via email on 11th February 2026',
    updatedBy: 'Admin2',
    db
  })
}

const v0680SendEvents = async ({ events }, serviceVersion, db, logger) => {
  logger.info(`Running send events for service version: ${serviceVersion}`)

  const event1 = events[0]
  await raiseHerdEvent({
    sbi: event1.sbi,
    message: 'Herd name updated',
    type: 'herd-name',
    raisedBy: 'Admin2',
    data: {
      herdId: event1.id,
      herdVersion: event1.version,
      herdName: 'Commercial Flock'
    }
  })

  const event2 = events[1]
  await raiseHerdEvent({
    sbi: event2.sbi,
    message: 'Herd associated with claim updated',
    type: 'claim-herdAssociated',
    raisedBy: 'Admin2',
    data: {
      herdId: 'UNNAMED_HERD_' + event2.claimReference,
      herdVersion: 1,
      reference: event2.claimReference,
      applicationReference: event2.applicationReference
    }
  })

  const event3 = events[2]
  await raiseHerdEvent({
    sbi: event3.sbi,
    message: 'Herd associated with claim updated',
    type: 'claim-herdAssociated',
    raisedBy: 'Admin2',
    data: {
      herdId: 'UNNAMED_HERD_' + event3.claimReference,
      herdVersion: 1,
      reference: event3.claimReference,
      applicationReference: event3.applicationReference
    }
  })
}

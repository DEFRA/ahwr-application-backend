import {
  createHerd,
  getHerdById,
  updateIsCurrentHerd
} from '../../../repositories/herd-repository.js'
import { arraysAreEqual } from '../../../lib/array-utils.js'
import {
  addHerdToClaimData,
  getByApplicationReference
} from '../../../repositories/claim-repository.js'
import crypto from 'crypto'

const hasHerdChanged = (existingHerd, updatedHerd) =>
  existingHerd.cph !== updatedHerd.cph ||
  !arraysAreEqual(existingHerd.reasons.sort(), updatedHerd.reasons.sort())

const isUpdate = (herd) => herd.version > 1

const validateUpdate = (existingHerd, updatedHerd) => {
  if (!existingHerd) {
    throw new Error('Herd not found')
  }
  if (!existingHerd.isCurrent) {
    throw new Error('Attempting to update an older version of a herd')
  }
  if (existingHerd.version === updatedHerd.version) {
    throw new Error('Attempting to update a herd with the same version')
  }
}

const buildNewHerd = (
  herd,
  applicationReference,
  createdBy,
  typeOfLivestock
) => ({
  id: crypto.randomUUID(),
  version: 1,
  applicationReference,
  species: typeOfLivestock,
  name: herd.name,
  cph: herd.cph,
  reasons: herd.reasons.sort(),
  createdBy,
  isCurrent: true
})

const buildUpdatedHerd = (
  existingHerd,
  herd,
  applicationReference,
  createdBy
) => ({
  id: existingHerd.id,
  version: existingHerd.version + 1,
  applicationReference,
  species: existingHerd.species,
  name: existingHerd.name,
  cph: herd.cph,
  reasons: herd.reasons.sort(),
  createdBy,
  isCurrent: true
})

const createOrUpdateHerd = async (
  herd,
  applicationReference,
  createdBy,
  typeOfLivestock,
  logger,
  db
) => {
  let herdData, updated

  if (isUpdate(herd)) {
    const existingHerd = await getHerdById(db, herd.id)
    validateUpdate(existingHerd, herd)

    if (hasHerdChanged(existingHerd, herd)) {
      herdData = buildUpdatedHerd(
        existingHerd,
        herd,
        applicationReference,
        createdBy
      )
      await createHerd(db, herdData)
      await updateIsCurrentHerd(db, herd.id, false, existingHerd.version)
      updated = true // To check, but actually does feel like we should be setting this
    } else {
      logger.info('Herd has not changed')
      herdData = existingHerd
      updated = false
    }
  } else {
    herdData = buildNewHerd(
      herd,
      applicationReference,
      createdBy,
      typeOfLivestock
    )
    await createHerd(db, herdData)
    updated = true
  }

  return { herdData, updated }
}

const addHerdToPreviousClaims = async ({
  claimHerdData,
  applicationReference,
  sbi,
  createdBy,
  previousClaims,
  logger,
  db
}) => {
  logger.info(
    `Associating new herd with previous claims for agreement: ${applicationReference}`
  )
  const previousClaimsWithoutHerd = previousClaims.filter(
    (claim) => !claim.herd?.id
  )
  await Promise.all(
    previousClaimsWithoutHerd.map((claim) =>
      addHerdToClaimData({
        claimRef: claim.reference,
        claimHerdData,
        createdBy,
        applicationReference,
        sbi,
        db
      })
    )
  )
}

export const processHerd = async ({
  herd,
  applicationReference,
  createdBy,
  typeOfLivestock,
  sbi,
  logger,
  db
}) => {
  const { herdData, updated } = await createOrUpdateHerd(
    herd,
    applicationReference,
    createdBy,
    typeOfLivestock,
    logger,
    db
  )

  const claimHerdData = {
    id: herdData.id,
    version: herdData.version,
    cph: herd.cph,
    name: herd.name,
    reasons: herd.reasons.sort(),
    associatedAt: new Date()
  }
  if (herd.same === 'yes') {
    const previousClaimsForSpecies = await getByApplicationReference({
      applicationReference,
      typeOfLivestock,
      db
    })
    await addHerdToPreviousClaims({
      claimHerdData,
      applicationReference,
      sbi,
      createdBy,
      previousClaims: previousClaimsForSpecies,
      logger,
      db
    })
  }

  return {
    herdData,
    claimHerdData,
    updated
  }
}

import { STATUS, POULTRY_SCHEME, AHWR_SCHEME } from 'ffc-ahwr-common-library'
import { CLAIMS_COLLECTION } from '../constants/index.js'
import crypto from 'node:crypto'

const SCHEME_FILTER = {
  [POULTRY_SCHEME]: { 'data.typesOfPoultry': { $exists: true } },
  [AHWR_SCHEME]: { 'data.typeOfLivestock': { $exists: true } }
}

export const createClaimIndexes = async (db) => {
  await db.collection(CLAIMS_COLLECTION).createIndex({
    createdAt: -1,
    'herd.cph': 1,
    'herd.id': 1
  })
}

export const getClaimByReference = async (db, reference) => {
  return db.collection(CLAIMS_COLLECTION).findOne({ reference }, { projection: { _id: 0 } })
}

export const getByApplicationReference = async ({
  db,
  applicationReference,
  typeOfLivestock,
  includeWithdrawns = false
}) => {
  const filter = {
    applicationReference
  }

  if (typeOfLivestock) {
    filter['data.typeOfLivestock'] = typeOfLivestock
  }

  if (!includeWithdrawns) {
    filter.status = { $ne: STATUS.WITHDRAWN }
  }

  return db.collection(CLAIMS_COLLECTION).find(filter).sort({ createdAt: -1 }).toArray()
}

export const createClaim = async (db, data) => {
  return db.collection(CLAIMS_COLLECTION).insertOne(data)
}

export const deleteClaim = async (db, reference) => {
  return db.collection(CLAIMS_COLLECTION).deleteOne({ reference })
}

export const updateClaimStatus = async ({ db, reference, status, user, updatedAt, note }) => {
  return db.collection(CLAIMS_COLLECTION).findOneAndUpdate(
    { reference },
    {
      $set: {
        status,
        updatedAt,
        updatedBy: user
      },
      $push: {
        statusHistory: {
          status,
          note,
          createdAt: updatedAt,
          createdBy: user
        }
      }
    },
    { returnDocument: 'after' }
  )
}

export const updateClaimStatuses = async ({ db, references, status, user, updatedAt }) => {
  if (!Array.isArray(references) || references.length === 0) {
    throw new Error('references must be a non-empty array')
  }

  const result = await db.collection(CLAIMS_COLLECTION).updateMany(
    { reference: { $in: references } },
    {
      $set: {
        status,
        updatedAt,
        updatedBy: user
      },
      $push: {
        statusHistory: {
          status,
          createdAt: updatedAt,
          createdBy: user
        }
      }
    }
  )

  return { updatedRecordCount: result.modifiedCount }
}

export const findOnHoldClaims = async ({ db, beforeDate, limit = 500 }) => {
  return db
    .collection(CLAIMS_COLLECTION)
    .find({
      status: STATUS.ON_HOLD,
      updatedAt: { $lte: beforeDate }
    })
    .limit(limit)
    .toArray()
}

export const isURNUnique = async ({
  db,
  applicationReferences,
  laboratoryURN,
  includeWithdrawns = false
}) => {
  const filter = {
    applicationReference: { $in: applicationReferences },
    'data.laboratoryURN': { $regex: `^${laboratoryURN}$`, $options: 'i' }
  }

  if (!includeWithdrawns) {
    filter.status = { $ne: STATUS.WITHDRAWN }
  }

  const result = await db.collection(CLAIMS_COLLECTION).findOne(filter)
  return !result
}

export const getClaimsCount = async ({ db, cph, herdId, scheme, includeWithdrawns = false }) => {
  const query = {
    'herd.cph': cph,
    'herd.id': { $ne: herdId },
    ...SCHEME_FILTER[scheme]
  }

  if (!includeWithdrawns) {
    query.status = { $ne: STATUS.WITHDRAWN }
  }

  return db.collection(CLAIMS_COLLECTION).countDocuments(query)
}

export const updateClaimData = async ({
  db,
  reference,
  updatedProperty,
  newValue,
  oldValue,
  note,
  user,
  updatedAt
}) => {
  return db.collection(CLAIMS_COLLECTION).findOneAndUpdate(
    { reference },
    {
      $set: {
        [`data.${updatedProperty}`]: newValue,
        updatedAt,
        updatedBy: user
      },
      $push: {
        updateHistory: {
          id: crypto.randomUUID(),
          note,
          newValue,
          oldValue,
          createdAt: updatedAt,
          createdBy: user,
          eventType: `claim-${updatedProperty}`,
          updatedProperty
        }
      }
    }
  )
}

export const deleteClaimDataField = async ({
  db,
  reference,
  deletedProperty,
  oldValue,
  note,
  user,
  updatedAt
}) => {
  return db.collection(CLAIMS_COLLECTION).findOneAndUpdate(
    { reference },
    {
      $unset: {
        [`data.${deletedProperty}`]: ''
      },
      $set: {
        updatedAt,
        updatedBy: user
      },
      $push: {
        updateHistory: {
          id: crypto.randomUUID(),
          note,
          newValue: null,
          oldValue,
          createdAt: updatedAt,
          createdBy: user,
          eventType: `claim-${deletedProperty}`,
          updatedProperty: deletedProperty
        }
      }
    }
  )
}

export const addHerdToClaimData = async ({
  claimRef,
  claimHerdData,
  createdBy,
  db,
  oldHerdName = 'Unnamed herd',
  note = 'Herd details were retroactively applied to this pre-multiple herds claim'
}) => {
  const { id, version, associatedAt, name, cph, reasons } = claimHerdData

  await db.collection(CLAIMS_COLLECTION).findOneAndUpdate(
    { reference: claimRef },
    {
      $set: {
        'herd.id': id,
        'herd.version': version,
        'herd.associatedAt': associatedAt,
        'herd.name': name,
        'herd.cph': cph,
        'herd.reasons': reasons,
        updatedBy: createdBy,
        updatedAt: new Date()
      },
      $push: {
        updateHistory: {
          id: crypto.randomUUID(),
          note,
          updatedProperty: 'herdName',
          newValue: name,
          oldValue: oldHerdName,
          eventType: 'claim-herdAssociated',
          createdBy,
          createdAt: new Date()
        }
      }
    }
  )
}

export const updateHerd = async ({
  claimRef,
  createdBy,
  db,
  note,
  newValue,
  oldValue,
  updatedProperty,
  claimHerdData
}) => {
  const { id, version, associatedAt, name, cph, reasons } = claimHerdData

  await db.collection(CLAIMS_COLLECTION).findOneAndUpdate(
    { reference: claimRef },
    {
      $set: {
        'herd.id': id,
        'herd.version': version,
        'herd.associatedAt': associatedAt,
        'herd.name': name,
        'herd.cph': cph,
        'herd.reasons': reasons,
        updatedBy: createdBy,
        updatedAt: new Date()
      },
      $push: {
        updateHistory: {
          id: crypto.randomUUID(),
          note,
          updatedProperty,
          newValue,
          oldValue,
          eventType: `claim-${updatedProperty}`,
          createdBy,
          createdAt: new Date()
        }
      }
    }
  )
}

export const removeHerdFromClaimData = async ({
  claimRef,
  oldClaimHerdName,
  updateNotes,
  updatedBy,
  db
}) => {
  await db.collection(CLAIMS_COLLECTION).findOneAndUpdate(
    { reference: claimRef },
    {
      $set: {
        herd: {},
        updatedBy,
        updatedAt: new Date()
      },
      $push: {
        updateHistory: {
          id: crypto.randomUUID(),
          note: updateNotes,
          updatedProperty: 'herdName',
          newValue: 'Unnamed herd',
          oldValue: oldClaimHerdName,
          eventType: 'claim-herdAssociated',
          createdBy: updatedBy,
          createdAt: new Date()
        }
      }
    }
  )
}

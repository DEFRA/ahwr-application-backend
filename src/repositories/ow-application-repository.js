import { OW_APPLICATION_COLLECTION } from '../constants/index.js'
import { v4 as uuid } from 'uuid'
import { getApplicationsFromCollectionBySbi } from './common.js'

export const isOWURNUnique = async ({ db, sbi, laboratoryURN }) => {
  const result = await db.collection(OW_APPLICATION_COLLECTION).findOne({
    'organisation.sbi': sbi,
    'data.urnResult': { $regex: `^${laboratoryURN}$`, $options: 'i' }
  })
  return !result
}

export const getOWApplication = async (db, reference) => {
  return db.collection(OW_APPLICATION_COLLECTION).findOne({
    reference
  })
}

export const getOWApplicationsBySbi = async (db, sbi) => {
  return getApplicationsFromCollectionBySbi(db, sbi, OW_APPLICATION_COLLECTION)
}

export const findOWApplication = async (db, reference) => {
  return db.collection(OW_APPLICATION_COLLECTION).findOne({ reference })
}

export const createOWFlag = async (db, applicationReference, data) => {
  return db
    .collection(OW_APPLICATION_COLLECTION)
    .updateOne({ reference: applicationReference }, { $push: { flags: data } })
}

export const deleteOWFlag = async (db, flagId, user, deletedNote) => {
  return db.collection(OW_APPLICATION_COLLECTION).findOneAndUpdate(
    { 'flags.id': flagId },
    {
      $set: {
        'flags.$.deletedAt': new Date(),
        'flags.$.deletedBy': user,
        'flags.$.deletedNote': deletedNote,
        'flags.$.deleted': true
      }
    },
    { returnDocument: 'after' }
  )
}

export const updateOWApplication = async ({
  db,
  reference,
  updatedPropertyPath,
  newValue,
  oldValue,
  note,
  user,
  updatedAt
}) => {
  const updatedProperty = updatedPropertyPath.split('.').pop()
  await db.collection(OW_APPLICATION_COLLECTION).findOneAndUpdate(
    { reference },
    {
      $set: {
        [updatedPropertyPath]: newValue,
        updatedAt,
        updatedBy: user
      },
      $push: {
        updateHistory: {
          id: uuid(),
          note,
          newValue,
          oldValue,
          createdAt: updatedAt,
          createdBy: user,
          eventType: `application-${updatedProperty}`,
          updatedProperty
        }
      }
    }
  )
}

// TODO: Remove as part of AHWR-1472
export const updateOWApplicationStatus = async ({ db, reference, status, user, updatedAt }) => {
  return db.collection(OW_APPLICATION_COLLECTION).findOneAndUpdate(
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
          createdAt: updatedAt,
          createdBy: user
        }
      }
    },
    { returnDocument: 'after' }
  )
}

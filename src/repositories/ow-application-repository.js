import { OW_APPLICATION_COLLECTION } from '../constants/index.js'
import { v4 as uuid } from 'uuid'

const flagNotDeletedFilter = {
  input: { $ifNull: ['$flags', []] },
  as: 'flag',
  cond: { $eq: ['$$flag.deleted', false] }
}

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
  return db
    .collection(OW_APPLICATION_COLLECTION)
    .aggregate([
      {
        $match: { 'organisation.sbi': sbi.toString() }
      },
      {
        $project: {
          reference: 1,
          createdAt: 1,
          updatedAt: 1,
          createdBy: 1,
          updatedBy: 1,
          data: 1,
          organisation: 1,
          status: 1,
          flags: {
            $map: {
              input: {
                $filter: flagNotDeletedFilter
              },
              as: 'flag',
              in: { appliesToMh: '$$flag.appliesToMh' }
            }
          },
          redacted: {
            $eq: [{ $ifNull: ['$redactionHistory.success', 'N'] }, 'Y']
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ])
    .toArray()
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
  const result = await db.collection(OW_APPLICATION_COLLECTION).findOneAndUpdate(
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
  return result
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

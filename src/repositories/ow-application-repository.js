import { OW_APPLICATION_COLLECTION } from '../constants/index.js'
import { v4 as uuid } from 'uuid'

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

export const findOWApplication = async (db, reference) => {
  return db.collection(OW_APPLICATION_COLLECTION).findOne({ reference })
}

export const createOWFlag = async (db, applicationReference, data) => {
  return db
    .collection(OW_APPLICATION_COLLECTION)
    .updateOne({ reference: applicationReference }, { $push: { flags: data } })
}

export const deleteOWFlag = async (db, flagId, user, deletedNote) => {
  const result = await db
    .collection(OW_APPLICATION_COLLECTION)
    .findOneAndUpdate(
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

export const updateOWApplicationData = async ({
  db,
  reference,
  updatedProperty,
  newValue,
  oldValue,
  note,
  user,
  updatedAt
}) => {
  await db.collection(OW_APPLICATION_COLLECTION).findOneAndUpdate(
    { reference },
    {
      $set: {
        [`data.${updatedProperty}`]: newValue,
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

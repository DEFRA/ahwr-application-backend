import { OW_APPLICATION_COLLECTION } from '../constants/index.js'

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

export const getOWFlagByAppRef = async (
  db,
  applicationReference,
  appliesToMh
) => {
  return db
    .collection(OW_APPLICATION_COLLECTION)
    .aggregate([
      { $match: { reference: applicationReference } },
      { $unwind: '$flags' },
      {
        $match: {
          'flags.appliesToMh': appliesToMh,
          $or: [
            { 'flags.deleted': false },
            { 'flags.deleted': null },
            { 'flags.deleted': { $exists: false } }
          ]
        }
      },
      { $limit: 1 },
      { $replaceRoot: { newRoot: '$flags' } }
    ])
    .next()
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
  return result?.flags?.find((f) => f.id === flagId)
}

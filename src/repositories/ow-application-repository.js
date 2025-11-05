import { OW_APPLICATION_COLLECTION } from '../constants/index.js'

export const isURNUnique = async ({ db, sbi, laboratoryURN }) => {
  const result = await db.collection(OW_APPLICATION_COLLECTION).findOne({
    'organisation.sbi': sbi,
    'data.urnResult': { $regex: `^${laboratoryURN}$`, $options: 'i' }
  })
  return !result
}

export const getApplication = async (db, reference) => {
  return db.collection(OW_APPLICATION_COLLECTION).findOne({
    reference
  })
}

export const findApplication = async (db, reference) => {
  return db.collection(OW_APPLICATION_COLLECTION).findOne({ reference })
}

export const getFlagByAppRef = async (
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

export const createFlag = async (db, applicationReference, data) => {
  return db
    .collection(OW_APPLICATION_COLLECTION)
    .updateOne({ reference: applicationReference }, { $push: { flags: data } })
}

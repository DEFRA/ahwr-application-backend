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

// import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { HERDS_COLLECTION } from '../constants/index.js'

export const createHerd = async (db, data) => {
  return db.collection(HERDS_COLLECTION).insertOne({
    ...data,
    createdAt: new Date()
  })
}

export const getHerdById = async (db, id) => {
  return db.collection(HERDS_COLLECTION).findOne({
    id,
    isCurrent: true
  })
}

export const updateIsCurrentHerd = async (db, id, isCurrent, version) => {
  return db.collection(HERDS_COLLECTION).updateOne({ id, version }, { $set: { isCurrent } })
}

export const getHerdsByAppRefAndSpecies = async ({ db, applicationReference, species }) => {
  return db
    .collection(HERDS_COLLECTION)
    .find({
      applicationReference,
      isCurrent: true,
      ...(species ? { species } : {})
    })
    .toArray()
}

// TODO: 1495 impl
export const redactHerdPII = async (applicationReference) => {
  return {}

  // await models.herd.update(
  //   {
  //     herdName: `${REDACT_PII_VALUES.REDACTED_HERD_NAME}`,
  //     cph: `${REDACT_PII_VALUES.REDACTED_CPH}`,
  //     updatedBy: 'admin',
  //     updatedAt: Date.now()
  //   },
  //   {
  //     where: {
  //       applicationReference
  //     }
  //   }
  // )
}

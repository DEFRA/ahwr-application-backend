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

export const getAllHerdVersionsById = async (db, id) => {
  return db
    .collection(HERDS_COLLECTION)
    .find({
      id
    })
    .toArray()
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

export const redactHerdPII = async (_applicationReference) => {
  return {}
}

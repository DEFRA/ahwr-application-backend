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
    id
  })
}

export const updateIsCurrentHerd = async (db, id, isCurrent, version) => {
  return db
    .collection(HERDS_COLLECTION)
    .updateOne({ id, version }, { $set: { isCurrent } })
  // return models.herd.update({ isCurrent }, { where: { id, version } })
}

export const getHerdsByAppRefAndSpecies = async (
  applicationReference,
  species
) => {
  // TODO 1182 impl
  return []

  // return models.herd.findAll({
  //   where: {
  //     applicationReference,
  //     ...(species ? { species } : {}),
  //     isCurrent: true
  //   }
  // })
}

export const redactPII = async (applicationReference) => {
  // TODO 1182 impl
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

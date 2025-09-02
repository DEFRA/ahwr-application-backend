// import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'

export const createHerd = async (data) => {
  // TODO 1182 impl
  return {}

  // return models.herd.create(data)
}

export const getHerdById = async (id) => {
  // TODO 1182 impl
  return {}

  // return models.herd.findOne({
  //   where: { id } // should this use isCurrent: true
  // })
}

export const updateIsCurrentHerd = async (id, isCurrent, version) => {
  // TODO 1182 impl
  return {}

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

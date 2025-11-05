// import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import {
  APPLICATION_COLLECTION,
  OW_APPLICATION_COLLECTION
} from '../constants/index.js'

export const getFlagsForApplication = async (applicationReference) => {
  // TODO 1182 impl
  return []

  // const result = await models.flag.findAll({
  //   where: { applicationReference, deletedAt: null, deletedBy: null }
  // })

  // return result.map((entry) => entry.dataValues)
}

export const deleteFlag = async (flagId, user, deletedNote) => {
  // TODO 1182 impl
  return {}

  // return models.flag.update(
  //   { deletedAt: new Date(), deletedBy: user, deletedNote },
  //   { where: { id: flagId }, returning: true }
  // )
}

export const getAllFlags = async (db) => {
  return db
    .collection(APPLICATION_COLLECTION)
    .aggregate([
      { $unwind: '$flags' },
      { $match: { 'flags.deleted': { $ne: true } } },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$flags',
              {
                applicationReference: '$reference',
                sbi: '$organisation.sbi'
              }
            ]
          }
        }
      },
      {
        $unionWith: {
          coll: OW_APPLICATION_COLLECTION,
          pipeline: [
            { $unwind: '$flags' },
            { $match: { 'flags.deleted': { $ne: true } } },
            {
              $replaceRoot: {
                newRoot: {
                  $mergeObjects: [
                    '$flags',
                    {
                      applicationReference: '$reference',
                      sbi: '$organisation.sbi'
                    }
                  ]
                }
              }
            }
          ]
        }
      }
    ])
    .toArray()
}

export const getFlagsForApplicationIncludingDeleted = async (
  applicationReference
) => {
  // TODO 1182 impl
  return []

  // return models.flag.findAll({ where: { applicationReference } })
}

export const redactPII = async (applicationReference) => {
  // TODO 1182 impl
  // await models.flag.update(
  //   {
  //     note: `${REDACT_PII_VALUES.REDACTED_NOTE}`,
  //     updatedBy: 'admin',
  //     updatedAt: Date.now()
  //   },
  //   {
  //     where: {
  //       applicationReference,
  //       note: { [Op.not]: null }
  //     }
  //   }
  // )
}

export const createFlagForRedactPII = async (data) => {
  // TODO 1182 impl
  return {}

  // const existingAppliesToMhFlag = await getFlagByAppRef(
  //   data.applicationReference,
  //   false
  // )
  // if (existingAppliesToMhFlag) {
  //   await deleteFlag(
  //     existingAppliesToMhFlag.id,
  //     'admin',
  //     "Deleted to allow 'Redact PII' flag to be added, only one flag with appliesToMh=false allowed."
  //   )
  // }

  // return createFlag(data)
}

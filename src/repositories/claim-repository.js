// import {
//   REDACT_PII_VALUES,
//   APPLICATION_REFERENCE_PREFIX_OLD_WORLD
// } from 'ffc-ahwr-common-library'
// import { claimDataUpdateEvent } from '../event-publisher/claim-data-update-event.js'
// import { findApplication } from './application-repository.js'

// const CLAIM_UPDATED_AT_COL = 'claim.updatedAt'
import { CLAIMS_COLLECTION } from '../constants/index.js'
import crypto from 'node:crypto'
import { v4 as uuid } from 'uuid'

export const getClaimByReference = async (db, reference) => {
  return db.collection(CLAIMS_COLLECTION).findOne({ reference }, { projection: { _id: 0 } })
}

export const getByApplicationReference = async ({ db, applicationReference, typeOfLivestock }) => {
  const filter = {
    applicationReference
  }

  if (typeOfLivestock) {
    filter['data.typeOfLivestock'] = typeOfLivestock
  }

  return db.collection(CLAIMS_COLLECTION).find(filter).sort({ createdAt: -1 }).toArray()
}

export const createClaim = async (db, data) => {
  return db.collection(CLAIMS_COLLECTION).insertOne(data)
}

export const updateClaimStatus = async ({ db, reference, status, user, updatedAt, note }) => {
  return db.collection(CLAIMS_COLLECTION).findOneAndUpdate(
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
          note,
          createdAt: updatedAt,
          createdBy: user
        }
      }
    },
    { returnDocument: 'after' }
  )
}

export const getAllClaimedClaims = async (claimStatusIds) => {
  // TODO 1182 impl
  return []

  // return models.claim.count({
  //   where: {
  //     statusId: claimStatusIds // shorthand for IN operator
  //   }
  // })
}

export const isURNUnique = async ({ db, applicationReferences, laboratoryURN }) => {
  const result = await db.collection(CLAIMS_COLLECTION).findOne({
    applicationReference: { $in: applicationReferences },
    'data.laboratoryURN': { $regex: `^${laboratoryURN}$`, $options: 'i' }
  })
  return !result
}

export const updateClaimData = async ({
  db,
  reference,
  updatedProperty,
  newValue,
  oldValue,
  note,
  user,
  updatedAt
}) => {
  return db.collection(CLAIMS_COLLECTION).findOneAndUpdate(
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
          eventType: `claim-${updatedProperty}`,
          updatedProperty
        }
      }
    }
  )
}

export const addHerdToClaimData = async ({ claimRef, claimHerdData, createdBy, db }) => {
  const { id, version, associatedAt, name } = claimHerdData

  await db.collection(CLAIMS_COLLECTION).findOneAndUpdate(
    { reference: claimRef },
    {
      $set: {
        'herd.id': id,
        'herd.version': version,
        'herd.associatedAt': associatedAt,
        updatedBy: createdBy,
        updatedAt: new Date()
      },
      $push: {
        updateHistory: {
          id: crypto.randomUUID(),
          note: 'Herd details were retroactively applied to this pre-multiple herds claim',
          updatedProperty: 'herdName',
          newValue: name,
          oldValue: 'Unnamed herd',
          eventType: 'claim-herdAssociated',
          createdBy,
          createdAt: new Date()
        }
      }
    }
  )
}

export const redactPII = async (applicationReference, logger) => {
  // TODO 1182 impl
  // const redactedValueByField = {
  //   vetsName: `${REDACT_PII_VALUES.REDACTED_VETS_NAME}`,
  //   vetRCVSNumber: `${REDACT_PII_VALUES.REDACTED_VET_RCVS_NUMBER}`,
  //   laboratoryURN: `${REDACT_PII_VALUES.REDACTED_LABORATORY_URN}`
  // }
  // let totalAffectedCount = 0
  // for (const [field, redactedValue] of Object.entries(redactedValueByField)) {
  //   const [affectedCount] = await models.claim.update(
  //     {
  //       data: Sequelize.fn(
  //         'jsonb_set',
  //         Sequelize.col('data'),
  //         Sequelize.literal(`'{${field}}'`),
  //         Sequelize.literal(`'"${redactedValue}"'`)
  //       ),
  //       updatedBy: 'admin',
  //       updatedAt: Date.now()
  //     },
  //     {
  //       where: {
  //         applicationReference,
  //         [Op.and]: Sequelize.literal(`data->>'${field}' IS NOT NULL`)
  //       }
  //     }
  //   )
  //   totalAffectedCount += affectedCount
  // }
  // logger.info(
  //   `Redacted ${totalAffectedCount} claim records for applicationReference: ${applicationReference}`
  // )
  // if (applicationReference.startsWith(APPLICATION_REFERENCE_PREFIX_OLD_WORLD)) {
  //   await redactOWClaimData(applicationReference, logger)
  // }
  // await models.claim_update_history.update(
  //   {
  //     note: `${REDACT_PII_VALUES.REDACTED_NOTE}`
  //   },
  //   {
  //     where: {
  //       applicationReference,
  //       note: { [Op.not]: null }
  //     }
  //   }
  // )
  // await models.claim_update_history.update(
  //   {
  //     newValue: `${REDACT_PII_VALUES.REDACTED_VETS_NAME}`,
  //     oldValue: `${REDACT_PII_VALUES.REDACTED_VETS_NAME}`
  //   },
  //   {
  //     where: {
  //       applicationReference,
  //       updatedProperty: 'vetName'
  //     }
  //   }
  // )
}

// const redactOWClaimData = async (applicationReference, logger) => {
//   const redactedValueByOWField = {
//     vetName: REDACT_PII_VALUES.REDACTED_VETS_NAME,
//     vetRcvs: REDACT_PII_VALUES.REDACTED_VET_RCVS_NUMBER,
//     urnResult: REDACT_PII_VALUES.REDACTED_LABORATORY_URN
//   }

//   let totalAffectedCount = 0
//   for (const [field, redactedValue] of Object.entries(redactedValueByOWField)) {
//     const [affectedCount] = await models.application.update(
//       {
//         data: Sequelize.fn(
//           'jsonb_set',
//           Sequelize.col('data'),
//           Sequelize.literal(`'{${field}}'`),
//           Sequelize.literal(`'"${redactedValue}"'`)
//         ),
//         updatedBy: 'admin',
//         updatedAt: Date.now()
//       },
//       {
//         where: {
//           reference: applicationReference,
//           [Op.and]: Sequelize.literal(`data->>'${field}' IS NOT NULL`)
//         }
//       }
//     )
//     totalAffectedCount += affectedCount
//   }

//   logger.info(
//     `Redacted ${totalAffectedCount} ow application records for applicationReference: ${applicationReference}`
//   )
// }

export const getAppRefsWithLatestClaimLastUpdatedBefore = async (years) => {
  // TODO 1182 impl
  return []

  // const now = new Date()
  // const updatedAtDate = new Date(
  //   Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate())
  // )

  // return models.claim.findAll({
  //   attributes: [
  //     'applicationReference',
  //     [Sequelize.fn('MAX', Sequelize.col(CLAIM_UPDATED_AT_COL)), 'updatedAt'],
  //     [
  //       Sequelize.literal('"application"."data"->\'organisation\'->>\'sbi\''),
  //       'sbi'
  //     ]
  //   ],
  //   include: [
  //     {
  //       model: models.application,
  //       attributes: [],
  //       required: true,
  //       where: {
  //         eligiblePiiRedaction: true
  //       }
  //     }
  //   ],
  //   group: ['applicationReference', 'application.data'],
  //   having: Sequelize.where(
  //     Sequelize.fn('MAX', Sequelize.col(CLAIM_UPDATED_AT_COL)),
  //     { [Op.lt]: updatedAtDate }
  //   ),
  //   order: [[Sequelize.fn('MAX', Sequelize.col(CLAIM_UPDATED_AT_COL)), 'DESC']]
  // })
}

// import {
//   REDACT_PII_VALUES,
//   APPLICATION_REFERENCE_PREFIX_OLD_WORLD
// } from 'ffc-ahwr-common-library'
// import { raiseClaimEvents, raiseHerdEvent } from '../event-publisher/index.js'
// import { claimDataUpdateEvent } from '../event-publisher/claim-data-update-event.js'
// import { findApplication } from './application-repository.js'

// const CLAIM_UPDATED_AT_COL = 'claim.updatedAt'

export const getClaimByReference = async (db, reference) => {
  return await db
    .collection('claim')
    .findOne({ reference }, { projection: { _id: 0 } })
}

export const getByApplicationReference = async (
  applicationReference,
  typeOfLivestock
) => {
  // TODO 1182 impl
  return []

  // const replacements = {
  //   applicationReference: applicationReference.toUpperCase()
  // }

  // let typeFilter = ''

  // if (typeOfLivestock) {
  //   typeFilter = "AND claim.data->>'typeOfLivestock' = :typeOfLivestock"
  //   replacements.typeOfLivestock = typeOfLivestock
  // }

  // const results = await sequelize.query(
  //   `
  //   SELECT claim.*, to_jsonb(herd) AS herd
  //   FROM claim
  //   LEFT JOIN herd
  //     ON claim.data->>'herdId' = herd.id::text
  //     AND herd."isCurrent" = true
  //   WHERE claim."applicationReference" = :applicationReference
  //   ${typeFilter}
  //   ORDER BY claim."createdAt" DESC
  //   `,
  //   {
  //     replacements,
  //     type: QueryTypes.SELECT
  //   }
  // )

  // return results
}

export const setClaim = async (data) => {
  // TODO 1182 impl
  return {}

  // const sbi = data.sbi
  // const result = await models.claim.create(data)
  // await raiseClaimEvents(
  //   {
  //     message: 'New claim has been created',
  //     claim: result.dataValues,
  //     raisedBy: result.dataValues.createdBy,
  //     raisedOn: result.dataValues.createdAt
  //   },
  //   sbi
  // )
  // return result
}

export const updateClaimByReference = async (data, note, logger) => {
  // TODO 1182 impl
  // try {
  //   const claim = await models.claim.findOne({
  //     where: {
  //       reference: data.reference
  //     }
  //   })
  //   if (claim?.dataValues?.statusId === data.statusId) {
  //     logger.info(
  //       `Claim ${data.reference} already has status ${data.statusId}, no update needed.`
  //     )
  //     return
  //   }
  //   const result = await models.claim.update(data, {
  //     where: {
  //       reference: data.reference
  //     },
  //     returning: true
  //   })
  //   const updatedRecord = result[1][0]
  //   await raiseClaimEvents(
  //     {
  //       message: 'Claim has been updated',
  //       claim: updatedRecord.dataValues,
  //       note,
  //       raisedBy: updatedRecord.dataValues.updatedBy,
  //       raisedOn: updatedRecord.dataValues.updatedAt
  //     },
  //     data.sbi
  //   )
  // } catch (err) {
  //   logger.setBindings({ err })
  //   throw err
  // }
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

export const isURNNumberUnique = async (sbi, laboratoryURN) => {
  // TODO 1182 impl
  return {}

  // const applications = await models.application.findAll({
  //   where: { 'data.organisation.sbi': sbi }
  // })

  // if (
  //   applications.find(
  //     (application) =>
  //       application.dataValues.data.urnResult?.toLowerCase() ===
  //       laboratoryURN.toLowerCase()
  //   )
  // ) {
  //   return { isURNUnique: false }
  // }

  // const applicationReferences = applications.map(
  //   (application) => application.dataValues.reference
  // )
  // const claims = await models.claim.findAll({
  //   where: { applicationReference: applicationReferences }
  // })

  // const isUnique = !claims.find(
  //   (claim) =>
  //     claim.dataValues.data.laboratoryURN?.toLowerCase() ===
  //     laboratoryURN.toLowerCase()
  // )

  // return { isURNUnique: isUnique }
}

export const findClaim = async (reference) => {
  // TODO 1182 impl
  return {}
  // const claim = await models.claim.findOne({ where: { reference } })
  // return claim === null ? claim : claim.dataValues
}

export const updateClaimData = async (
  reference,
  updatedProperty,
  newValue,
  oldValue,
  note,
  user
) => {
  // TODO 1182 impl
  // const data = Sequelize.fn(
  //   'jsonb_set',
  //   Sequelize.col('data'),
  //   Sequelize.literal(`'{${updatedProperty}}'`),
  //   Sequelize.literal(`'${JSON.stringify(newValue)}'`)
  // )
  // // eslint-disable-next-line no-unused-vars
  // const [_, updates] = await models.claim.update(
  //   { data },
  //   {
  //     where: { reference },
  //     returning: true
  //   }
  // )
  // const [updatedRecord] = updates
  // const { applicationReference, updatedAt } = updatedRecord.dataValues
  // const application = await findApplication(applicationReference)
  // const eventData = {
  //   applicationReference,
  //   reference,
  //   updatedProperty,
  //   newValue,
  //   oldValue,
  //   note
  // }
  // await claimDataUpdateEvent(
  //   eventData,
  //   `claim-${convertUpdatedPropertyToStandardType(updatedProperty)}`,
  //   user,
  //   updatedAt,
  //   application.data.organisation.sbi
  // )
  // await models.claim_update_history.create({
  //   applicationReference,
  //   reference,
  //   note,
  //   updatedProperty,
  //   newValue,
  //   oldValue,
  //   eventType: `claim-${updatedProperty}`,
  //   createdBy: user
  // })
}

export const addHerdToClaimData = async ({
  claimRef,
  herdClaimData,
  createdBy,
  applicationReference,
  sbi
}) => {
  // TODO 1182 impl
  // const { herdId, herdVersion, herdAssociatedAt, herdName } = herdClaimData
  // const data = Sequelize.fn(
  //   'jsonb_set',
  //   Sequelize.fn(
  //     'jsonb_set',
  //     Sequelize.fn(
  //       'jsonb_set',
  //       Sequelize.col('data'),
  //       Sequelize.literal("'{herdId}'"),
  //       Sequelize.literal(`'${JSON.stringify(herdId)}'`)
  //     ),
  //     Sequelize.literal("'{herdVersion}'"),
  //     Sequelize.literal(`'${JSON.stringify(herdVersion)}'`)
  //   ),
  //   Sequelize.literal("'{herdAssociatedAt}'"),
  //   Sequelize.literal(`'${JSON.stringify(herdAssociatedAt)}'`)
  // )
  // // eslint-disable-next-line no-unused-vars
  // const [_, _updates] = await models.claim.update(
  //   {
  //     data,
  //     updatedBy: createdBy
  //   },
  //   {
  //     where: { reference: claimRef },
  //     returning: true
  //   }
  // )
  // await models.claim_update_history.create({
  //   applicationReference,
  //   reference: claimRef,
  //   note: 'Herd details were retroactively applied to this pre-multiple herds claim',
  //   updatedProperty: 'herdName',
  //   newValue: herdName,
  //   oldValue: 'Unnamed herd',
  //   eventType: 'claim-herdAssociated',
  //   createdBy
  // })
  // await raiseHerdEvent({
  //   sbi,
  //   message: 'Herd associated with claim',
  //   type: 'claim-herdAssociated',
  //   data: {
  //     herdId,
  //     herdVersion,
  //     reference: claimRef,
  //     applicationReference
  //   }
  // })
}

export const findAllClaimUpdateHistory = (reference) => {
  // TODO 1182 impl
  return []
  // return models.claim_update_history.findAll({
  //   where: { reference }
  // })
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

const convertUpdatedPropertyToStandardType = (updatedProperty) => {
  switch (updatedProperty) {
    case 'vetsName':
      return 'vetName'
    case 'vetRCVSNumber':
      return 'vetRcvs'
    case 'dateOfVisit':
      return 'visitDate'
    default:
      return updatedProperty
  }
}

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

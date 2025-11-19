// import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
// import { raiseApplicationStatusEvent } from '../event-publisher/index.js'
import { startandEndDate } from '../lib/date-utils.js'
// import { claimDataUpdateEvent } from '../event-publisher/claim-data-update-event.js'

import {
  APPLICATION_COLLECTION,
  OW_APPLICATION_COLLECTION
} from '../constants/index.js'

export const getApplication = async ({
  db,
  reference,
  includeDeletedFlags = false
}) => {
  const flagFilter = includeDeletedFlags
    ? '$flags'
    : {
        $filter: {
          input: '$flags',
          as: 'flag',
          cond: { $eq: ['$$flag.deleted', false] }
        }
      }

  return db
    .collection(APPLICATION_COLLECTION)
    .aggregate([
      {
        $match: {
          reference: reference.toUpperCase()
        }
      },
      {
        $project: {
          _id: 0,
          reference: 1,
          createdAt: 1,
          updatedAt: 1,
          createdBy: 1,
          updatedBy: 1,
          data: 1,
          organisation: 1,
          status: 1,
          flags: {
            $map: {
              input: flagFilter,
              as: 'flag',
              in: { appliesToMh: '$$flag.appliesToMh' }
            }
          },
          redacted: {
            $eq: [{ $ifNull: ['$redactionHistory.success', 'N'] }, 'Y']
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ])
    .next()
}

export const getByEmail = async (email) => {
  // TODO 1182 impl
  return {}
  // return models.application.findOne({
  //   order: [['createdAt', 'DESC']],
  //   where: { 'data.organisation.email': email.toLowerCase() }
  // })
}

export const evalSortField = (sort) => {
  if (sort?.field) {
    const direction = sort.direction?.toUpperCase() === 'DESC' ? -1 : 1

    switch (sort.field.toLowerCase()) {
      case 'status':
        return { status: direction }

      case 'apply date':
        return { createdAt: direction }

      case 'reference':
        return { reference: direction }

      case 'sbi':
        return { 'organisation.sbi': direction }

      case 'organisation':
        return { 'organisation.name': direction }

      default:
        return { createdAt: direction }
    }
  }

  return { createdAt: -1 }
}

const buildSearchQuery = (searchText, searchType, filter) => {
  const query = {}

  if (searchText) {
    switch (searchType) {
      case 'sbi':
        query['organisation.sbi'] = searchText
        break

      case 'organisation':
        query['organisation.name'] = { $regex: searchText, $options: 'i' }
        break

      case 'ref':
        query.reference = searchText
        break

      case 'date': {
        const { startDate, endDate } = startandEndDate(searchText)
        query.createdAt = { $gte: startDate, $lt: endDate }
        break
      }

      case 'status':
        query.status = {
          $regex: searchText.toUpperCase().replace(/ /g, '_'),
          $options: 'i'
        }
        break

      default:
        break
    }
  }

  if (filter && filter.length > 0) {
    query.status = { $in: filter }
  }

  return query
}

export const searchApplications = async (
  db,
  searchText,
  searchType,
  filter,
  offset = 0,
  limit = 10,
  sort = { field: 'createdAt', direction: 'DESC' }
) => {
  const query = buildSearchQuery(searchText, searchType, filter)

  const totalResult = await db
    .collection(APPLICATION_COLLECTION)
    .aggregate([
      { $match: query },
      {
        $unionWith: {
          coll: OW_APPLICATION_COLLECTION,
          pipeline: [{ $match: query }]
        }
      },
      { $count: 'total' }
    ])
    .toArray()
  const total = totalResult[0]?.total || 0

  let applications = []

  if (total > 0) {
    applications = await db
      .collection(APPLICATION_COLLECTION)
      .aggregate([
        { $match: query },
        {
          $addFields: {
            type: 'EE'
          }
        },
        {
          $unionWith: {
            coll: OW_APPLICATION_COLLECTION,
            pipeline: [
              { $match: query },
              {
                $addFields: {
                  type: 'VV'
                }
              }
            ]
          }
        },
        { $sort: evalSortField(sort) },
        { $skip: offset },
        { $limit: limit },
        {
          $addFields: {
            flags: {
              $filter: {
                input: { $ifNull: ['$flags', []] },
                as: 'flag',
                cond: { $ne: ['$$flag.deleted', true] }
              }
            }
          }
        }
      ])
      .toArray()
  }

  return {
    applications,
    total
  }
}

export const getAllApplications = async () => {
  // TODO 1182 impl
  return []
  // const query = {
  //   order: [['createdAt', 'DESC']]
  // }
  // return models.application.findAll(query)
}

export const updateApplicationByReference = async (
  dataWithNote,
  publishEvent = true
) => {
  // TODO 1182 impl
  return {}
  // const { note, ...data } = dataWithNote

  // try {
  //   const application = await models.application.findOne({
  //     where: {
  //       reference: data.reference
  //     },
  //     returning: true
  //   })

  //   if (application?.dataValues?.statusId === data?.statusId) {
  //     return application
  //   }

  //   const result = await models.application.update(data, {
  //     where: {
  //       reference: data.reference
  //     },
  //     returning: true
  //   })

  //   const updatedRows = result[0] // Number of affected rows
  //   const updatedRecords = result[1] // Assuming this is the array of updated records

  //   if (publishEvent) {
  //     for (let i = 0; i < updatedRows; i++) {
  //       const updatedRecord = updatedRecords[i]
  //       await raiseApplicationStatusEvent({
  //         message: 'Application has been updated',
  //         application: updatedRecord.dataValues,
  //         raisedBy: updatedRecord.dataValues.updatedBy,
  //         raisedOn: updatedRecord.dataValues.updatedAt,
  //         note
  //       })
  //     }
  //   }

  //   return result
  // } catch (error) {
  //   console.error('Error updating application by reference:', error)
  //   throw error
  // }
}

export const findApplication = async (db, reference) => {
  return db.collection(APPLICATION_COLLECTION).findOne({ reference })
}

export const getApplicationsToRedactOlderThan = async (years) => {
  // TODO 1182 impl
  return []
  // const now = new Date()
  // const cutoffDate = new Date(
  //   Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate())
  // )

  // return models.application.findAll({
  //   where: {
  //     reference: {
  //       [Op.notIn]: Sequelize.literal(
  //         '(SELECT reference FROM application_redact)'
  //       )
  //     },
  //     createdAt: {
  //       [Op.lt]: cutoffDate
  //     },
  //     eligiblePiiRedaction: {
  //       [Op.eq]: true
  //     }
  //   },
  //   attributes: [
  //     'reference',
  //     [literal("data->'organisation'->>'sbi'"), 'sbi'],
  //     'statusId'
  //   ],
  //   order: [['createdAt', 'ASC']]
  // })
}

export const getOWApplicationsToRedactLastUpdatedBefore = async (years) => {
  // TODO 1182 impl
  return []
  // const now = new Date()
  // const cutoffDate = new Date(
  //   Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate())
  // )

  // return models.application.findAll({
  //   where: {
  //     reference: {
  //       [Op.notIn]: Sequelize.literal(
  //         '(SELECT reference FROM application_redact)'
  //       )
  //     },
  //     updatedAt: {
  //       [Op.lt]: cutoffDate
  //     },
  //     eligiblePiiRedaction: {
  //       [Op.eq]: true
  //     },
  //     type: 'VV'
  //   },
  //   attributes: ['reference', [literal("data->'organisation'->>'sbi'"), 'sbi']],
  //   order: [['updatedAt', 'ASC']]
  // })
}

export const redactPII = async (agreementReference, logger) => {
  // TODO 1182 impl
  // const redactedValueByJSONPath = {
  //   'organisation,name': REDACT_PII_VALUES.REDACTED_NAME,
  //   'organisation,email': REDACT_PII_VALUES.REDACTED_EMAIL,
  //   'organisation,orgEmail': REDACT_PII_VALUES.REDACTED_ORG_EMAIL,
  //   'organisation,farmerName': REDACT_PII_VALUES.REDACTED_FARMER_NAME,
  //   'organisation,address': REDACT_PII_VALUES.REDACTED_ADDRESS
  // }
  // let totalUpdates = 0
  // for (const [jsonPath, redactedValue] of Object.entries(
  //   redactedValueByJSONPath
  // )) {
  //   const jsonPathSql = jsonPath
  //     .split(',')
  //     .map((key) => `->'${key}'`)
  //     .join('')
  //   const [affectedCount] = await models.application.update(
  //     {
  //       data: Sequelize.fn(
  //         'jsonb_set',
  //         Sequelize.col('data'),
  //         Sequelize.literal(`'{${jsonPath}}'`),
  //         Sequelize.literal(`'"${redactedValue}"'`),
  //         true
  //       ),
  //       updatedBy: 'admin',
  //       updatedAt: Sequelize.fn('NOW')
  //     },
  //     {
  //       where: {
  //         reference: agreementReference,
  //         [Op.and]: Sequelize.literal(`data${jsonPathSql} IS NOT NULL`)
  //       }
  //     }
  //   )
  //   totalUpdates += affectedCount
  // }
  // if (totalUpdates > 0) {
  //   logger.info(
  //     `Redacted ${totalUpdates} application records for agreementReference: ${agreementReference}`
  //   )
  // } else {
  //   logger.info(
  //     `No records updated for agreementReference: ${agreementReference}`
  //   )
  // }
}

export const updateEligiblePiiRedaction = async (
  reference,
  newValue,
  user,
  note
) => {
  // TODO 1182 impl
  // const [affectedCount] = await models.application.update(
  //   { eligiblePiiRedaction: newValue },
  //   {
  //     where: {
  //       reference,
  //       eligiblePiiRedaction: { [Op.ne]: newValue } // only update if value has changed
  //     },
  //     returning: true
  //   }
  // )
  // if (affectedCount > 0) {
  //   const updatedProperty = 'eligiblePiiRedaction'
  //   const type = `application-${updatedProperty}`
  //   await models.application_update_history.create({
  //     applicationReference: reference,
  //     note,
  //     updatedProperty,
  //     newValue,
  //     oldValue: !newValue,
  //     eventType: type,
  //     createdBy: user
  //   })
  // }
}

export const getApplicationsBySbi = async (db, sbi) => {
  return db
    .collection(APPLICATION_COLLECTION)
    .aggregate([
      {
        $match: { 'organisation.sbi': sbi.toString() }
      },
      {
        $project: {
          reference: 1,
          createdAt: 1,
          updatedAt: 1,
          createdBy: 1,
          updatedBy: 1,
          data: 1,
          organisation: 1,
          status: 1,
          flags: {
            $map: {
              input: {
                $filter: {
                  input: '$flags',
                  as: 'flag',
                  cond: { $eq: ['$$flag.deleted', false] }
                }
              },
              as: 'flag',
              in: { appliesToMh: '$$flag.appliesToMh' }
            }
          },
          redacted: {
            $eq: [{ $ifNull: ['$redactionHistory.success', 'N'] }, 'Y']
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ])
    .toArray()
}

export const createApplication = async (db, application) => {
  return db.collection(APPLICATION_COLLECTION).insertOne(application)
}

export const createFlag = async (db, applicationReference, data) => {
  return db
    .collection(APPLICATION_COLLECTION)
    .updateOne({ reference: applicationReference }, { $push: { flags: data } })
}

export const deleteFlag = async (db, flagId, user, deletedNote) => {
  const result = await db.collection(APPLICATION_COLLECTION).findOneAndUpdate(
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
  return result
}

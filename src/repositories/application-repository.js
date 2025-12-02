import { STATUS } from 'ffc-ahwr-common-library'
// import { raiseApplicationStatusEvent } from '../event-publisher/index.js'
import { startAndEndDate } from '../lib/date-utils.js'
// import { claimDataUpdateEvent } from '../event-publisher/claim-data-update-event.js'
// import { reminders as reminderTypes } from 'ffc-ahwr-common-library'
import { APPLICATION_COLLECTION, OW_APPLICATION_COLLECTION } from '../constants/index.js'
import { v4 as uuid } from 'uuid'

const flagNotDeletedFilter = {
  input: { $ifNull: ['$flags', []] },
  as: 'flag',
  cond: { $eq: ['$$flag.deleted', false] }
}

export const getApplication = async ({ db, reference, includeDeletedFlags = false }) => {
  const flagFilter = includeDeletedFlags
    ? '$flags'
    : {
        $filter: flagNotDeletedFilter
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
          },
          eligiblePiiRedaction: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ])
    .next()
}

export const getApplicationWithFullFlags = async ({ db, reference }) => {
  return db.collection(APPLICATION_COLLECTION).findOne({ reference })
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
        const { startDate, endDate } = startAndEndDate(searchText)
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

const defaultSort = () => ({ field: 'createdAt', direction: 'DESC' })

export const searchApplications = async (
  db,
  searchText,
  searchType,
  filter,
  offset = 0,
  limit = 10,
  sort = defaultSort()
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
              $filter: flagNotDeletedFilter
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

export const updateApplication = async ({
  db,
  reference,
  updatedPropertyPath,
  newValue,
  oldValue,
  note,
  user,
  updatedAt
}) => {
  const updatedProperty = updatedPropertyPath.split('.').pop()
  return db.collection(APPLICATION_COLLECTION).findOneAndUpdate(
    { reference },
    {
      $set: {
        [updatedProperty]: newValue,
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
          eventType: `application-${updatedProperty}`,
          updatedProperty
        }
      }
    },
    { returnDocument: 'after' }
  )
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
                $filter: flagNotDeletedFilter
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

export const getRemindersToSend = async (
  reminderType,
  reminderWindowStartDate,
  reminderWindowEndDate,
  laterReminders,
  maxBatchSize,
  db,
  logger
) => {
  logger.info(
    `Getting reminders due, reminder type '${reminderType}', window start '${reminderWindowStartDate}', end '${reminderWindowEndDate}' and haven't already received later reminders '${laterReminders?.join(',')}'`
  )

  // const reminderTypesToExclude = laterReminders
  //   ? [reminderType, ...laterReminders]
  //   : [reminderType]

  const baseQuery = {
    type: 'EE',
    statusId: { $ne: STATUS.NOT_AGREED },
    createdAt: { $lte: reminderWindowStartDate }
    // TODO replace this is condition that checks application history
    // reminders: { $nin: reminderTypesToExclude }
  }
  const query = reminderWindowEndDate
    ? {
        ...baseQuery,
        createdAt: {
          $gte: reminderWindowEndDate,
          $lte: reminderWindowStartDate
        }
      }
    : baseQuery

  const pipeline = [
    {
      $lookup: {
        from: 'claims',
        localField: 'reference',
        foreignField: 'applicationReference',
        as: 'claimMatches'
      }
    },
    {
      $match: { ...query, claimMatches: { $size: 0 } }
    }
  ]

  const projection = {
    reference: 1,
    crn: { $eq: ['$organisation.crn'] },
    sbi: { $eq: ['$organisation.sbi'] },
    email: { $eq: ['$organisation.email'] },
    orgEmail: { $eq: ['$organisation.orgEmail'] },
    // TODO replace this is condition that checks application history
    // reminders: 1,
    reminderType: { $literal: reminderType },
    createdAt: 1
  }

  const sort = { createdAt: 1 }

  return db
    .collection(APPLICATION_COLLECTION)
    .aggregate(pipeline)
    .sort(sort)
    .project(projection)
    .limit(maxBatchSize)
    .toArray()
}

export const updateReminders = async (reference, newReminder, _oldReminder, db, logger) => {
  const filter = { reference }
  // TODO replace this is condition that checks application history
  const updateDocument = {} // { $set: { reminders: newReminder } }
  // TODO add updated history to above!
  // await models.application_update_history.create({
  //     applicationReference: reference,
  //     note: 'Reminder sent',
  //     updatedProperty,
  //     newValue: newReminder,
  //     oldValue: oldReminder,
  //     eventType: type,
  //     createdBy: 'admin'
  //   })
  // }

  const result = db.collection(APPLICATION_COLLECTION).updateOne(filter, updateDocument)

  logger.info(`Successfully updated reminders, rows affected: ${result.modifiedCount}`)
}

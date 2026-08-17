import { STATUS } from 'ffc-ahwr-common-library'
import { APPLICATION_COLLECTION, OW_APPLICATION_COLLECTION } from '../constants/index.js'
import crypto from 'node:crypto'
import { flagNotDeletedFilter, getApplicationsFromCollectionBySbi } from './common.js'
import { applyAgreementTypeFilter } from './filters/agreement-type-filter.js'
import { applyDateRangeFilter } from './filters/date-range-filter.js'
import { applyFlagFilter } from './filters/flag-filter.js'
import { applyStatusFilter } from './filters/status-filter.js'

export const createApplicationIndexes = async (db) => {
  await db.collection(APPLICATION_COLLECTION).createIndex({
    reference: 1
  })
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
  const result = await db.collection(APPLICATION_COLLECTION).findOne({ reference })
  if (result) {
    return result
  }
  return db.collection(OW_APPLICATION_COLLECTION).findOne({ reference })
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

const buildSearchQuery = ({
  searchText,
  searchType,
  status,
  agreementType,
  flag,
  dateFrom,
  dateTo
}) => {
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

      default:
        break
    }
  }

  applyAgreementTypeFilter(query, agreementType)

  applyDateRangeFilter(query, dateFrom, dateTo)

  applyStatusFilter(query, status)

  applyFlagFilter(query, flag)

  return query
}

const defaultSort = () => ({ field: 'createdAt', direction: 'DESC' })

export const searchApplications = async (
  db,
  criteria,
  offset = 0,
  limit = 10,
  sort = defaultSort()
) => {
  const query = buildSearchQuery(criteria)

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
          id: crypto.randomUUID(),
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

export const getApplicationsBySbi = async (db, sbi) => {
  return getApplicationsFromCollectionBySbi(db, sbi, APPLICATION_COLLECTION)
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
  return db.collection(APPLICATION_COLLECTION).findOneAndUpdate(
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

  const baseQuery = {
    type: 'EE',
    statusId: { $ne: STATUS.NOT_AGREED },
    createdAt: { $lte: reminderWindowStartDate }
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

export const updateReminders = async (reference, _newReminder, _oldReminder, db, logger) => {
  // This should get the count from the history of the application
  // and update correctly the reminders in the document
  const filter = { reference }
  const updateDocument = {}
  const result = db.collection(APPLICATION_COLLECTION).updateOne(filter, updateDocument)

  logger.info(`Successfully updated reminders, rows affected: ${result.modifiedCount}`)
}

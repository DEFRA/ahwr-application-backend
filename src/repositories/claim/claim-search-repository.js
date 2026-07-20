import { startAndEndDate } from '../../lib/date-utils.js'
import { APPLICATION_COLLECTION, CLAIMS_COLLECTION } from '../../constants/index.js'
import { applyAgreementTypeFilter } from '../filters/agreement-type-filter.js'
import { applyStatusFilter } from '../filters/status-filter.js'

const SEARCH_TYPES = new Set(['ref', 'appRef', 'type', 'species', 'status', 'sbi', 'date', 'reset'])

const evalSortField = (sort) => {
  const direction = sort?.direction?.toUpperCase() === 'DESC' ? -1 : 1
  const field = sort?.field?.toLowerCase()

  if (!field) {
    return { createdAt: direction }
  }

  const orderBySortField = {
    status: { status: direction },
    'claim date': { createdAt: direction },
    sbi: { 'application.organisation.sbi': direction },
    'claim number': { reference: direction },
    'type of visit': { type: direction },
    species: { 'data.typeOfLivestock': direction }
  }

  return orderBySortField[field] || { createdAt: direction }
}

const applyClaimSearchConditions = (matchStage, search) => {
  const { text, type } = search || {}

  switch (type) {
    case 'ref':
      matchStage.reference = { $regex: text, $options: 'i' }
      break
    case 'appRef':
      matchStage.applicationReference = { $regex: text, $options: 'i' }
      break
    case 'species':
      matchStage['data.typeOfLivestock'] = { $regex: text, $options: 'i' }
      break
    case 'date': {
      const { startDate, endDate } = startAndEndDate(text)
      matchStage['createdAt'] = {
        $gte: startDate,
        $lt: endDate
      }
      break
    }
    default:
      break
  }
}

const applyApplicationSearchConditions = async (db, matchStage, text) => {
  const result = await db
    .collection(APPLICATION_COLLECTION)
    .aggregate([
      { $match: { 'organisation.sbi': { $regex: text, $options: 'i' } } },
      { $project: { reference: 1 } }
    ])
    .toArray()

  const applicationRefs = result.map((a) => a.reference)

  matchStage['applicationReference'] = { $in: applicationRefs }
}

const getDefaultSort = () => ({ field: 'createdAt', direction: 'DESC' })

export const searchClaims = async (db, criteria, offset, limit, sort = getDefaultSort()) => {
  const { search, status, agreementType } = criteria

  if (search?.type && !SEARCH_TYPES.has(search.type)) {
    return { total: 0, claims: [] }
  }

  const query = {}

  if (search?.text && search?.type) {
    if (search.type === 'sbi') {
      await applyApplicationSearchConditions(db, query, search.text)
    } else {
      applyClaimSearchConditions(query, search)
    }
  }

  applyAgreementTypeFilter(query, agreementType, 'applicationReference')
  applyStatusFilter(query, status)

  const pipeline = [
    { $match: query },
    {
      $facet: {
        data: [
          { $sort: evalSortField(sort) },
          { $skip: offset },
          { $limit: limit },
          {
            $lookup: {
              from: 'applications',
              localField: 'applicationReference',
              foreignField: 'reference',
              as: 'application'
            }
          },
          { $unwind: '$application' },
          {
            $set: {
              'application.flags': {
                $filter: {
                  input: '$application.flags',
                  as: 'flag',
                  cond: { $ne: ['$$flag.deleted', true] }
                }
              }
            }
          }
        ],
        total: [{ $count: 'total' }]
      }
    }
  ]

  const result = await db.collection(CLAIMS_COLLECTION).aggregate(pipeline).toArray()

  return {
    claims: result[0].data,
    total: result[0].total[0]?.total || 0
  }
}

import { startandEndDate } from '../../lib/date-utils.js'
import { CLAIMS_COLLECTION } from '../../constants/index.js'

const MONGO_OP_BY_FILTER_OP = {
  eq: '$eq',
  ne: '$ne',
  gt: '$gt',
  gte: '$gte',
  lt: '$lt',
  lte: '$lte',
  in: '$in',
  nin: '$nin',
  regex: '$regex'
}

const SEARCH_TYPES = [
  'ref',
  'appRef',
  'type',
  'species',
  'status',
  'sbi',
  'date',
  'reset'
]
const APPLICATION_SEARCH_TYPES = ['sbi']

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
  if (!text || !type) {
    return
  }

  switch (type) {
    case 'ref':
      matchStage.reference = { $regex: text, $options: 'i' }
      break
    case 'appRef':
      matchStage.applicationReference = { $regex: text, $options: 'i' }
      break
    case 'status':
      matchStage.status = {
        $regex: text.toUpperCase().replace(/ /g, '_'),
        $options: 'i'
      }
      break
    case 'species':
      matchStage['data.typeOfLivestock'] = { $regex: text, $options: 'i' }
      break
    case 'date': {
      const { startDate, endDate } = startandEndDate(text)
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

const applyApplicationSearchConditions = (matchStage, search) => {
  const { text, type } = search || {}
  if (!text || !type) {
    return
  }

  if (type === 'sbi') {
    matchStage['application.organisation.sbi'] = {
      $regex: text,
      $options: 'i'
    }
  }
}

export const searchClaims = async (
  search,
  filter,
  offset,
  limit,
  sort = { field: 'createdAt', direction: 'DESC' },
  db
) => {
  if (search?.type && !SEARCH_TYPES.includes(search.type)) {
    return { total: 0, claims: [] }
  }

  const claimMatchStage = {}
  const appMatchStage = {}

  if (search) {
    if (APPLICATION_SEARCH_TYPES.includes(search.type)) {
      applyApplicationSearchConditions(appMatchStage, search)
    } else {
      applyClaimSearchConditions(claimMatchStage, search)
    }
  }

  const pipeline = [
    { $match: claimMatchStage },
    {
      $lookup: {
        from: 'applications',
        localField: 'applicationReference',
        foreignField: 'reference',
        as: 'application'
      }
    },
    { $unwind: { path: '$application', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        'application.flags': {
          $filter: {
            input: '$application.flags',
            as: 'flag',
            cond: { $eq: ['$$flag.deletedBy', null] }
          }
        }
      }
    }
  ]

  if (Object.keys(appMatchStage).length > 0) {
    pipeline.push({ $match: appMatchStage })
  }

  if (filter) {
    const mongoOp = MONGO_OP_BY_FILTER_OP[filter.op]
    if (mongoOp) {
      pipeline.push({
        $match: {
          [filter.field]: { [mongoOp]: filter.value }
        }
      })
    }
  }

  const countPipeline = [...pipeline, { $count: 'total' }]
  const totalResult = await db
    .collection(CLAIMS_COLLECTION)
    .aggregate(countPipeline)
    .toArray()
  const total = totalResult[0]?.total || 0

  pipeline.push(
    { $sort: evalSortField(sort) },
    { $skip: offset },
    { $limit: limit }
  )

  const claims = await db
    .collection(CLAIMS_COLLECTION)
    .aggregate(pipeline)
    .toArray()

  return { total, claims }
}

import { APPLICATION_COLLECTION } from '../../../constants/index.js'

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
                  cond: { $eq: ['$$flag.deletedBy', null] }
                }
              },
              as: 'flag',
              in: { appliesToMh: '$$flag.appliesToMh' }
            }
          },
          redacted: {
            $anyElementTrue: {
              $map: {
                input: { $ifNull: ['$applicationRedacts', []] },
                as: 'r',
                in: { $eq: ['$$r.success', 'Y'] }
              }
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ])
    .toArray()
}

export const getLatestApplicationBySbi = async (db, sbi) => {
  // TODO: What about retrieving old world application from other collection?
  return db
    .collection(APPLICATION_COLLECTION)
    .find({ 'organisation.sbi': sbi })
    .sort({ createdAt: -1 })
    .limit(1)
    .next()
}

export const createApplication = async (db, application) => {
  return db.collection(APPLICATION_COLLECTION).insertOne(application)
}

export const flagNotDeletedFilter = {
  input: { $ifNull: ['$flags', []] },
  as: 'flag',
  cond: { $eq: ['$$flag.deleted', false] }
}

export const getApplicationsFromCollectionBySbi = async (db, sbi, collection) => {
  return db
    .collection(collection)
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

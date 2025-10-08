export const getApplicationsBySbi = async (db, sbi) => {
  return db
    .collection('applications')
    .aggregate([
      {
        $match: { 'organisation.sbi': sbi }
      },
      {
        $addFields: {
          flags: {
            $filter: {
              input: '$flags',
              as: 'flag',
              cond: { $eq: ['$$flag.deletedBy', null] }
            }
          }
        }
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
          'flags.appliesToMh': 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ])
    .toArray()
}

export const getLatestApplicationBySbi = async (db, sbi) => {
  return db
    .collection('applications')
    .find({ 'organisation.sbi': sbi })
    .sort({ createdAt: -1 })
    .limit(1)
    .next()
}

export const createApplication = async (db, application) => {
  return db.collection('applications').insertOne(application)
}

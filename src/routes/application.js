import { findApplication } from '../example-find.js'

const application = {
  method: 'GET',
  path: '/application',
  handler: async (request, h) => {
    const application = await getApplicationFromDatabaseByClaimReference(
      request.db
    )

    return h.response({ message: 'success', data: application })
  }
}

const getApplicationFromDatabaseByClaimReference = async (db) => {
  return (await findApplication(db))[0]
}

export { application }

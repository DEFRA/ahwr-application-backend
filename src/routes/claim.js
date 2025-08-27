import { findClaim } from '../example-find.js'

const claim = {
  method: 'GET',
  path: '/claim/{reference}',
  handler: async (request, h) => {
    const claim = await getClaimFromDatabase(
      request.db,
      request.params.reference
    )

    return h.response({ message: 'success', data: claim })
  }
}

const getClaimFromDatabase = async (db, claimReference) => {
  return (await findClaim(db))[0]
}

export { claim }

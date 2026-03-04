import { updateClaimStatus } from '../../repositories/claim-repository.js'

// Example supportingData, add to secrets via CDP portal:
// DATA_CHANGE_V0691_DATA={"datastoreUpdates":[{"claimRef":"REDC-MJ9J-SFHD","claimStatus":"RECOMMENDED_TO_PAY"}]}

export const updateDatastore = async (serviceVersion, { datastoreUpdates }, db, logger) => {
  logger.info(`Running datastore updates for service version: ${serviceVersion}`)

  const update1 = datastoreUpdates[0]
  await updateClaimStatus({
    reference: update1.claimRef,
    status: update1.claimStatus,
    user: 'Admin2',
    updatedAt: new Date().toISOString(),
    note: 'Requested change from Samantha Smith via email on 23rd February 2026',
    db
  })
}

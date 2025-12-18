import { APPLICATION_COLLECTION, CLAIMS_COLLECTION, HERDS_COLLECTION } from '../constants/index.js'

export const deleteDataForSbis = async (sbisToDelete, db) => {
  const applications = await db
    .collection(APPLICATION_COLLECTION)
    .find({ 'organisation.sbi': { $in: sbisToDelete } }, { projection: { reference: 1 } })
    .toArray()

  const appRefs = applications.map((app) => app.reference)

  if (!appRefs.length) {
    return {
      applicationsDeleted: 0,
      herdsDeleted: 0,
      claimsDeleted: 0
    }
  }

  const [herds, claims, applicationsDelete] = await Promise.all([
    db.collection(HERDS_COLLECTION).deleteMany({
      applicationReference: { $in: appRefs }
    }),
    db.collection(CLAIMS_COLLECTION).deleteMany({
      applicationReference: { $in: appRefs }
    }),
    db.collection(APPLICATION_COLLECTION).deleteMany({
      reference: { $in: appRefs }
    })
  ])

  return {
    applicationsDeleted: applicationsDelete.deletedCount,
    herdsDeleted: herds.deletedCount,
    claimsDeleted: claims.deletedCount
  }
}

export const deleteDataForSbis = async (sbisToDelete, db) => {
  const applications = await db
    .collection('applications')
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
    db.collection('herds').deleteMany({
      applicationReference: { $in: appRefs }
    }),
    db.collection('claims').deleteMany({
      applicationReference: { $in: appRefs }
    }),
    db.collection('applications').deleteMany({
      reference: { $in: appRefs }
    })
  ])

  return {
    applicationsDeleted: applicationsDelete.deletedCount,
    herdsDeleted: herds.deletedCount,
    claimsDeleted: claims.deletedCount
  }
}

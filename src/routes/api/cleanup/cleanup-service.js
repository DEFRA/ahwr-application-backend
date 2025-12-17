import { deleteDataForSbis } from '../../../repositories/cleanup-repository.js'

export const cleanupBySbi = async (sbisToDelete, db, logger) => {
  const { applicationsDeleted, herdsDeleted, claimsDeleted } = await deleteDataForSbis(
    sbisToDelete,
    db
  )

  logger.info(
    `Deleted ${applicationsDeleted} applications, ${herdsDeleted} herds and ${claimsDeleted} claims for ${sbisToDelete.length} sbis provided.`
  )
}

import { raiseHerdEvent } from '../event-publisher/index.js'

export const emitHerdMIEvents = async ({
  sbi,
  herdData,
  herdIdSelected,
  herdGotUpdated,
  claimReference,
  applicationReference
}) => {
  const {
    id: herdId,
    version: herdVersion,
    name: herdName,
    species: herdSpecies,
    cph: herdCph,
    reasons
  } = herdData

  if (herdVersion === 1 && herdIdSelected !== herdId) {
    await raiseHerdEvent({
      sbi,
      message: 'Herd temporary ID became herdId',
      type: 'herd-tempIdHerdId',
      data: { tempHerdId: herdIdSelected, herdId }
    })
  }

  if (herdGotUpdated) {
    await raiseHerdEvent({
      sbi,
      message: 'New herd version created',
      type: 'herd-versionCreated',
      data: {
        herdId,
        herdVersion,
        herdName,
        herdSpecies,
        herdCph,
        herdReasonManagementNeeds: reasons.includes('separateManagementNeeds'),
        herdReasonUniqueHealth: reasons.includes('uniqueHealthNeeds'),
        herdReasonDifferentBreed: reasons.includes('differentBreed'),
        herdReasonOtherPurpose: reasons.includes('differentPurpose'),
        herdReasonKeptSeparate: reasons.includes('keptSeparate'),
        herdReasonOnlyHerd: reasons.includes('onlyHerd'),
        herdReasonOther: reasons.includes('other')
      }
    })
  }

  await raiseHerdEvent({
    sbi,
    message: 'Herd associated with claim',
    type: 'claim-herdAssociated',
    data: {
      herdId,
      herdVersion,
      reference: claimReference,
      applicationReference
    }
  })
}

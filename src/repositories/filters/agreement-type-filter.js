import {
  APPLICATION_REFERENCE_PREFIX_OLD_WORLD,
  APPLICATION_REFERENCE_PREFIX_NEW_WORLD,
  APPLICATION_REFERENCE_PREFIX_POULTRY
} from 'ffc-ahwr-common-library'

export const AGREEMENT_TYPE_REFERENCE_PREFIXES = {
  IAHW: [APPLICATION_REFERENCE_PREFIX_OLD_WORLD, APPLICATION_REFERENCE_PREFIX_NEW_WORLD],
  PBR: [APPLICATION_REFERENCE_PREFIX_POULTRY]
}

export const applyAgreementTypeFilter = (query, agreementType, field = 'reference') => {
  const prefixes = AGREEMENT_TYPE_REFERENCE_PREFIXES[agreementType]

  // Skip when agreementType is 'ALL'/absent, or when an exact reference search already constrains the field
  if (!prefixes || query[field]) {
    return
  }

  query[field] = { $regex: `^(${prefixes.join('|')})`, $options: 'i' }
}

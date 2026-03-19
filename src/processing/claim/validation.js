import { validateAhwrClaim } from './ahwr/base-validation.js'
import { AHWR_SCHEME, POULTRY_SCHEME } from 'ffc-ahwr-common-library'
import { validatePoultryClaim } from './poultry/base-validation.js'

export const validateClaim = (scheme, claimData, applicationFlags) => {
  // forward on to scheme
  if (scheme === AHWR_SCHEME) {
    return validateAhwrClaim(claimData, applicationFlags)
  }

  if (scheme === POULTRY_SCHEME) {
    return validatePoultryClaim(claimData)
  }

  throw new Error(`Unsupported scheme - ${scheme} : cannot validate claim`)
}

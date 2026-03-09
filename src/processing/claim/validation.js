import { validateAhwrClaim } from './ahwr/base-validation.js'
import { AHWR_SCHEME } from 'ffc-ahwr-common-library'
import { validatePoultryClaim } from './poultry/poultry-validation.js'

export const validateClaim = (scheme, claimData, applicationFlags) => {
  // forward on to scheme
  if (scheme === AHWR_SCHEME) {
    return validateAhwrClaim(claimData, applicationFlags)
  } else if (scheme === 'poultry') { // TODO: update this to use constant when added to library
    return validatePoultryClaim(claimData, applicationFlags)
  }

  throw new Error(`Unsupported scheme - ${scheme} : cannot validate claim`)
}

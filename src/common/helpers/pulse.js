import hapiPulse from 'hapi-pulse'
import { getLogger } from '../../logging/logger.js'

const tenSeconds = 10 * 1000

const pulse = {
  plugin: hapiPulse,
  options: {
    logger: getLogger(),
    timeout: tenSeconds
  }
}

export { pulse }

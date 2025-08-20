import { health } from '../routes/health.js'
import { claim } from '../routes/claim.js'
import { application } from '../routes/application.js'

const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route([health,claim,application])
    }
  }
}

export { router }

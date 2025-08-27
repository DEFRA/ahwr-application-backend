import { health } from '../routes/health.js'
import { claim } from '../routes/claim.js'
import { application } from '../routes/application.js'
import { example } from '../routes/example.js'

const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route([health, claim, application].concat(example))
    }
  }
}

export { router }

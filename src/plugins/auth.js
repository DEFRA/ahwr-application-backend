import Boom from '@hapi/boom'
import { config, defaultApiKey } from '../config/config.js'

export const authPlugin = {
  plugin: {
    name: 'auth',
    register: async (server, _options) => {
      const { publicUiApiKey, backofficeUiApiKey, messageGeneratorApiKey, testsApiKey } =
        config.get('apiKeys')

      // Setup credentials
      const API_KEYS = {}

      if (publicUiApiKey && publicUiApiKey !== defaultApiKey) {
        API_KEYS[publicUiApiKey] = 'public-ui'
      }

      if (backofficeUiApiKey && backofficeUiApiKey !== defaultApiKey) {
        API_KEYS[backofficeUiApiKey] = 'backoffice-ui'
      }

      if (messageGeneratorApiKey && messageGeneratorApiKey !== defaultApiKey) {
        API_KEYS[messageGeneratorApiKey] = 'message-generator'
      }

      if (testsApiKey && testsApiKey !== defaultApiKey) {
        API_KEYS[testsApiKey] = 'tests'
      }

      const apiKeyScheme = () => ({
        authenticate(request, h) {
          const apiKey = request.headers['x-api-key']
          const service = API_KEYS[apiKey]

          if (!apiKey || !service) {
            throw Boom.unauthorized('Invalid API key')
          }

          return h.authenticated({ credentials: { app: service } })
        }
      })

      server.auth.scheme('api-key', apiKeyScheme)
      server.auth.strategy('service-key', 'api-key')
      server.auth.default('service-key') // apply to all routes
    }
  }
}

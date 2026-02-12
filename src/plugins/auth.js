import Boom from '@hapi/boom'

export const authPlugin = {
  plugin: {
    name: 'auth',
    register: async (server, _options) => {
      // Setup credentials
      const API_KEYS = {
        [process.env.PUBLIC_UI_API_KEY]: 'public-ui',
        [process.env.BACKOFFICE_UI_API_KEY]: 'backoffice-ui',
        [process.env.MESSAGE_GENERATOR_API_KEY]: 'message-generator'
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

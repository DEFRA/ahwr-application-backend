import { router } from './router.js'
import { config } from '../config/config.js'
import { cleanupHandlers } from '../routes/api/cleanup/cleanup-routes.js'

describe('router', () => {
  let mockServer

  beforeEach(() => {
    mockServer = {
      route: jest.fn()
    }
    jest.clearAllMocks()
  })

  it('does NOT register cleanupHandlers in prod environment', () => {
    jest.spyOn(config, 'get').mockReturnValue('prod')

    router.plugin.register(mockServer, {})

    const allRoutes = mockServer.route.mock.calls[0][0] // arguments sent to route()
    const cleanupRoutesRegistered = allRoutes.some((r) => cleanupHandlers.includes(r))
    expect(cleanupRoutesRegistered).toBe(false)
  })

  it('registers cleanupHandlers in a dev environment', () => {
    jest.spyOn(config, 'get').mockReturnValue('dev')

    router.plugin.register(mockServer, {})

    const allRoutes = mockServer.route.mock.calls[0][0]
    const cleanupRoutesRegistered = allRoutes.some((r) => cleanupHandlers.includes(r))
    expect(cleanupRoutesRegistered).toBe(true)
  })
})

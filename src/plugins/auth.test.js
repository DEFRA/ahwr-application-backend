import { config, defaultApiKey } from '../config/config.js'
import { authPlugin } from './auth.js'

describe('auth', () => {
  let mockServer

  beforeEach(() => {
    mockServer = {
      auth: {
        scheme: jest.fn(),
        strategy: jest.fn(),
        default: jest.fn()
      }
    }
    jest.clearAllMocks()
  })

  it('does NOT register API keys that are left at default', () => {
    let keyCheckFunction
    const mockAuthenticated = jest.fn()
    mockServer.auth.scheme.mockImplementation((key, schemeFunction) => {
      keyCheckFunction = schemeFunction
    })
    jest.spyOn(config, 'get').mockReturnValue({
      publicUiApiKey: 'overridden',
      backofficeUiApiKey: defaultApiKey,
      messageGeneratorApiKey: defaultApiKey,
      testsApiKey: defaultApiKey
    })

    authPlugin.plugin.register(mockServer, {})

    expect(keyCheckFunction).toBeDefined()
    keyCheckFunction().authenticate(
      { headers: { 'x-api-key': 'overridden' } },
      { authenticated: mockAuthenticated }
    )
    expect(mockAuthenticated).toHaveBeenCalledWith({ credentials: { app: 'public-ui' } })
    expect(() =>
      keyCheckFunction().authenticate(
        { headers: { 'x-api-key': defaultApiKey } },
        { authenticated: mockAuthenticated }
      )
    ).toThrow('Invalid API key')
  })

  it('other non-default keys can be registered', () => {
    let keyCheckFunction
    const mockAuthenticated = jest.fn()
    mockServer.auth.scheme.mockImplementation((key, schemeFunction) => {
      keyCheckFunction = schemeFunction
    })
    jest.spyOn(config, 'get').mockReturnValue({
      publicUiApiKey: defaultApiKey,
      backofficeUiApiKey: defaultApiKey,
      messageGeneratorApiKey: 'key-for-message-gen',
      testsApiKey: 'key-for-tests'
    })

    authPlugin.plugin.register(mockServer, {})

    expect(keyCheckFunction).toBeDefined()
    keyCheckFunction().authenticate(
      { headers: { 'x-api-key': 'key-for-message-gen' } },
      { authenticated: mockAuthenticated }
    )
    expect(mockAuthenticated).toHaveBeenCalledWith({ credentials: { app: 'message-generator' } })
    keyCheckFunction().authenticate(
      { headers: { 'x-api-key': 'key-for-tests' } },
      { authenticated: mockAuthenticated }
    )
    expect(mockAuthenticated).toHaveBeenCalledWith({ credentials: { app: 'tests' } })
  })
})

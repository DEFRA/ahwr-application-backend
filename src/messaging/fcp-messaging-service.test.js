import { config } from '../config/config.js'
import {
  getFcpEventPublisher,
  startFcpMessagingService,
  stopFcpMessagingService
} from './fcp-messaging-service.js'
import { createEventPublisher, createServiceBusClient } from 'ffc-ahwr-common-library'

jest.mock('ffc-ahwr-common-library')

describe('FCP messaging service test', () => {
  const mockEventPublisher = { publishEvent: jest.fn() }
  const mockServiceBusClient = { close: jest.fn() }
  const mockLogger = {
    warn: jest.fn(),
    error: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('when audit events disabled, use stub', async () => {
    config.set('isAuditEventEnabled', false)
    await startFcpMessagingService(mockLogger)

    expect(getFcpEventPublisher()).not.toBe(mockEventPublisher)
    expect(getFcpEventPublisher()).toHaveProperty('publishEvent')
    expect(createServiceBusClient).toHaveBeenCalledTimes(0)

    await stopFcpMessagingService()
    expect(mockServiceBusClient.close).toHaveBeenCalledTimes(0)
  })

  test('when audit events enabled, use Messaging service to send', async () => {
    config.set('isAuditEventEnabled', true)
    createServiceBusClient.mockReturnValueOnce(mockServiceBusClient)
    createEventPublisher.mockReturnValueOnce(mockEventPublisher)
    await startFcpMessagingService(mockLogger)

    expect(getFcpEventPublisher()).toBe(mockEventPublisher)
    expect(createServiceBusClient).toHaveBeenCalledTimes(1)

    await stopFcpMessagingService()
    expect(mockServiceBusClient.close).toHaveBeenCalledTimes(1)
  })
})

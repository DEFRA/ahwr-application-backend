import { CLAIMS_COLLECTION } from '../../constants/index.js'
import { processChanges } from './process_changes.js'
import { getFcpEventPublisher } from '../../messaging/fcp-messaging-service.js'
import { TYPE_OF_CHANGE } from './schema.js'

jest.mock('../../messaging/fcp-messaging-service')

const deletion = {
  claimRef: 'RESH-806C-B87D',
  sbi: '123456789',
  applicationRef: 'IAHW-G7B4-UTZ5',
  action: TYPE_OF_CHANGE.DELETION
}

// const herdChange = {
//   claimRef: 'FUBC-JTTU-SDQ7',
//   sbi: '123456789',
//   applicationRef: 'IAHW-G7B4-UTZ5',
//   field: 'herdReasons',
//   newValue: ['onlyHerd'],
//   oldValue: ['uniqueHealthNeeds'],
//   action: TYPE_OF_CHANGE.FIELD_CHANGE
// }

// const changeOfDataField = {
//   claimRef: 'RESH-VASQ-XIXS',
//   sbi: '107695939',
//   applicationRef: 'IAHW-21C5-1417',
//   field: 'dateOfTesting',
//   newValue: '2025-12-12T00:00:00.000Z',
//   oldValue: '2025-12-11T00:00:00.000Z',
//   action: TYPE_OF_CHANGE.FIELD_CHANGE
// }

// const skipDataChange = {
//   claimRef: 'RESH-VASQ-XIXS',
//   sbi: '107695939',
//   applicationRef: 'IAHW-21C5-1417',
//   field: 'dateOfTesting',
//   newValue: '2025-12-12T00:00:00.000Z',
//   oldValue: '2025-12-11T00:00:00.000Z',
//   skipDataChange: true,
//   action: TYPE_OF_CHANGE.FIELD_CHANGE
// }

// const skipSendEvent = {
//   claimRef: 'REBC-CBLH-B5BB',
//   sbi: '106275882',
//   applicationRef: 'IAHW-LTYF-KXEC',
//   field: 'dateOfTesting',
//   newValue: '2025-06-02T00:00:00.000Z',
//   oldValue: '2025-06-01T00:00:00.000Z',
//   skipSendEvent: true,
//   action: TYPE_OF_CHANGE.FIELD_CHANGE
// }

// const input_data = [deletion, herdChange, changeOfDataField, skipDataChange, skipSendEvent]

const mockPublishEvent = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  getFcpEventPublisher.mockReturnValue({ publishEvent: mockPublishEvent })
  mockPublishEvent.mockResolvedValue()
})

const mockDeleteOne = jest.fn()
const mockCollection = { deleteOne: mockDeleteOne }
const mockDb = { collection: jest.fn(() => mockCollection) }
const mockLogger = { info: jest.fn() }

describe('Data deletion', () => {
  test('We can delete a record', async () => {
    mockDeleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 })
    const results = await processChanges([deletion], mockDb, mockLogger)

    expect(results[0]).toEqual({ ...deletion, success: true })
    expect(mockDeleteOne).toHaveBeenCalledWith({ reference: deletion.claimRef })
    expect(mockDb.collection).toHaveBeenCalledWith(CLAIMS_COLLECTION)
    expect(mockLogger.info).toHaveBeenCalledWith(`${deletion.claimRef} has processed successfully`)
  })

  test('When we delete a record, an event is being sent', async () => {
    mockDeleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 })
    await processChanges([deletion], mockDb, mockLogger)

    expect(mockPublishEvent).toHaveBeenCalledWith({
      name: 'send-session-event',
      id: expect.any(String),
      sbi: deletion.sbi,
      cph: 'n/a',
      checkpoint: expect.any(String),
      status: 'success',
      type: 'application:status-updated:WITHDRAWN',
      message: 'Claim has been updated',
      data: {
        reference: deletion.claimRef,
        applicationReference: deletion.applicationRef,
        status: 'WITHDRAWN'
      },
      raisedBy: 'Admin2',
      raisedOn: expect.any(String)
    })
  })

  test('If not deleted, we return no success', async () => {
    mockDeleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 0 })
    const results = await processChanges([deletion], mockDb, mockLogger)

    expect(results[0]).toEqual({ ...deletion, success: false, reason: 'Does not exists' })
    expect(mockDeleteOne).toHaveBeenCalledWith({ reference: deletion.claimRef })
    expect(mockDb.collection).toHaveBeenCalledWith(CLAIMS_COLLECTION)
    expect(mockLogger.info).toHaveBeenCalledWith(
      `${deletion.claimRef} has failed because Does not exists`
    )
  })

  test('If an error is thrown, we return no success', async () => {
    mockDeleteOne.mockRejectedValue(new Error('Connection failed'))
    const results = await processChanges([deletion], mockDb, mockLogger)

    expect(results[0]).toEqual({
      ...deletion,
      success: false,
      reason: 'Connection failed'
    })
    expect(mockDeleteOne).toHaveBeenCalledWith({ reference: deletion.claimRef })
    expect(mockDb.collection).toHaveBeenCalledWith(CLAIMS_COLLECTION)
    expect(mockLogger.info).toHaveBeenCalledWith(
      `${deletion.claimRef} has failed because Connection failed`
    )
  })
})

describe('data structure validation', () => {
  test('If data structure is invalid, we return no success', async () => {
    const invalidChange = {
      claimRef: 'RESH-806C-B87D'
      // missing sbi, applicationRef, action
    }

    const results = await processChanges([invalidChange], mockDb, mockLogger)

    expect(results[0]).toEqual({
      ...invalidChange,
      success: false,
      reason: 'Incorrect data structure'
    })

    expect(mockDeleteOne).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(
      `${invalidChange.claimRef} has failed because Incorrect data structure`
    )
  })

  test('If data structure is invalid and has no claimRef, we return no success', async () => {
    const invalidChange = {
      sbi: '123456789'
      // missing claimRef, applicationRef, action
    }

    const results = await processChanges([invalidChange], mockDb, mockLogger)

    expect(results[0]).toEqual({
      ...invalidChange,
      success: false,
      reason: 'Incorrect data structure'
    })

    expect(mockDeleteOne).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(
      'undefined has failed because Incorrect data structure'
    )
  })

  test('If change is null, we return no success', async () => {
    const results = await processChanges([null], mockDb, mockLogger)

    expect(results[0]).toEqual({
      success: false,
      reason: 'Incorrect data structure'
    })

    expect(mockDeleteOne).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(
      'undefined has failed because Incorrect data structure'
    )
  })
})

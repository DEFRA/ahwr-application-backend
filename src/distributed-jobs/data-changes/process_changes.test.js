import { MULTIPLE_HERD_REASONS } from 'ffc-ahwr-common-library'
import { CLAIMS_COLLECTION, HERDS_COLLECTION } from '../../constants/index.js'
import { processChanges } from './process_changes.js'
import { getFcpEventPublisher } from '../../messaging/fcp-messaging-service.js'
import { TYPE_OF_CHANGE } from './schema.js'

jest.mock('../../messaging/fcp-messaging-service')

const deletion = {
  claimRef: 'RESH-806C-B87D',
  sbi: '123456789',
  applicationRef: 'IAHW-G7B4-UTZ5',
  action: TYPE_OF_CHANGE.DELETION,
  dateRequested: '2025-12-12T00:00:00.000Z',
  requester: 'Some_One'
}

const herdChange = {
  claimRef: 'FUBC-JTTU-SDQ7',
  sbi: '123456789',
  applicationRef: 'IAHW-G7B4-UTZ5',
  field: 'herdReasons',
  dateRequested: '2025-12-12T00:00:00.000Z',
  requester: 'Some_One',
  newValue: ['onlyHerd'],
  oldValue: ['uniqueHealthNeeds'],
  action: TYPE_OF_CHANGE.FIELD_CHANGE
}

const changeOfDataField = {
  claimRef: 'RESH-VASQ-XIXS',
  sbi: '107695939',
  applicationRef: 'IAHW-21C5-1417',
  field: 'dateOfTesting',
  dateRequested: '2025-12-12T00:00:00.000Z',
  requester: 'Some_One',
  newValue: '2025-12-12T00:00:00.000Z',
  oldValue: '2025-12-11T00:00:00.000Z',
  action: TYPE_OF_CHANGE.FIELD_CHANGE
}

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
const mockFindOneAndUpdate = jest.fn()
const mockFindOne = jest.fn()
const mockUpdateOne = jest.fn()
const mockInsertOne = jest.fn()
const mockCollection = {
  deleteOne: mockDeleteOne,
  findOneAndUpdate: mockFindOneAndUpdate,
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
  insertOne: mockInsertOne
}
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

describe('Field change', () => {
  test('We can change a data field', async () => {
    mockFindOneAndUpdate.mockResolvedValue({ reference: changeOfDataField.claimRef })
    const results = await processChanges([changeOfDataField], mockDb, mockLogger)

    expect(results[0]).toEqual({ ...changeOfDataField, success: true })
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { reference: changeOfDataField.claimRef },
      {
        $set: {
          [`data.${changeOfDataField.field}`]: changeOfDataField.newValue,
          updatedAt: expect.any(Date),
          updatedBy: 'Admin2'
        },
        $push: {
          updateHistory: {
            id: expect.any(String),
            updatedProperty: changeOfDataField.field,
            newValue: changeOfDataField.newValue,
            oldValue: changeOfDataField.oldValue,
            note: `Requested on ${changeOfDataField.dateRequested} by ${changeOfDataField.requester}`,
            eventType: 'claim-dateOfTesting',
            createdAt: expect.any(Date),
            createdBy: 'Admin2'
          }
        }
      }
    )
    expect(mockDb.collection).toHaveBeenCalledWith(CLAIMS_COLLECTION)
    expect(mockLogger.info).toHaveBeenCalledWith(
      `${changeOfDataField.claimRef} has processed successfully`
    )
  })

  test('When we change a data field, an event is being sent', async () => {
    mockFindOneAndUpdate.mockResolvedValue({ reference: changeOfDataField.claimRef })
    await processChanges([changeOfDataField], mockDb, mockLogger)

    expect(mockPublishEvent).toHaveBeenCalledWith({
      name: 'send-session-event',
      id: expect.any(String),
      sbi: changeOfDataField.sbi,
      cph: 'n/a',
      checkpoint: expect.any(String),
      status: 'success',
      type: 'claim-dateOfTesting',
      message: 'Claim data updated',
      data: {
        applicationReference: changeOfDataField.applicationRef,
        reference: changeOfDataField.claimRef,
        newValue: changeOfDataField.newValue,
        oldValue: changeOfDataField.oldValue,
        updatedProperty: 'dateOfTesting',
        note: `Requested on ${changeOfDataField.dateRequested} by ${changeOfDataField.requester}`
      },
      raisedBy: 'Admin2',
      raisedOn: expect.any(String)
    })
  })

  test('If not updated, we return no success', async () => {
    mockFindOneAndUpdate.mockResolvedValue(null)
    const results = await processChanges([changeOfDataField], mockDb, mockLogger)

    expect(results[0]).toEqual({ ...changeOfDataField, success: false, reason: 'Does not exists' })
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { reference: changeOfDataField.claimRef },
      expect.any(Object)
    )
    expect(mockDb.collection).toHaveBeenCalledWith(CLAIMS_COLLECTION)
    expect(mockLogger.info).toHaveBeenCalledWith(
      `${changeOfDataField.claimRef} has failed because Does not exists`
    )
  })

  test('If an error is thrown, we return no success', async () => {
    mockFindOneAndUpdate.mockRejectedValue(new Error('Connection failed'))
    const results = await processChanges([changeOfDataField], mockDb, mockLogger)

    expect(results[0]).toEqual({
      ...changeOfDataField,
      success: false,
      reason: 'Connection failed'
    })
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { reference: changeOfDataField.claimRef },
      expect.any(Object)
    )
    expect(mockDb.collection).toHaveBeenCalledWith(CLAIMS_COLLECTION)
    expect(mockLogger.info).toHaveBeenCalledWith(
      `${changeOfDataField.claimRef} has failed because Connection failed`
    )
  })
})

describe('herd changes', () => {
  // The herd flow mutates the records it reads, so build fresh copies per test
  const buildClaim = () => ({
    reference: herdChange.claimRef,
    applicationReference: herdChange.applicationRef,
    herd: {
      id: 'herd-abc-123',
      version: 1,
      name: 'Commercial Herd',
      cph: '12/345/6789',
      reasons: ['uniqueHealthNeeds'],
      associatedAt: new Date('2025-01-01T00:00:00.000Z')
    }
  })

  const buildHerd = () => ({
    _id: 'mongo-object-id',
    id: 'herd-abc-123',
    version: 1,
    applicationReference: herdChange.applicationRef,
    name: 'Commercial Herd',
    species: 'beef',
    cph: '12/345/6789',
    reasons: ['uniqueHealthNeeds'],
    isCurrent: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    createdBy: 'farmer',
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedBy: 'farmer',
    migratedRecord: false
  })

  beforeEach(() => {
    // getClaimByReference is read first, then getHerdById
    mockFindOne.mockResolvedValueOnce(buildClaim()).mockResolvedValueOnce(buildHerd())
    mockUpdateOne.mockResolvedValue({ acknowledged: true })
    mockInsertOne.mockResolvedValue({ acknowledged: true })
    mockFindOneAndUpdate.mockResolvedValue({ reference: herdChange.claimRef })
  })

  // The reasons are passed as the keys of MULTIPLE_HERD_REASONS, plus 'onlyHerd'
  // which we keep as an option even though it is not part of the common library.
  const flagForReason = {
    separateManagementNeeds: 'herdReasonManagementNeeds',
    uniqueHealthNeeds: 'herdReasonUniqueHealth',
    differentBreed: 'herdReasonDifferentBreed',
    differentPurpose: 'herdReasonOtherPurpose',
    keptSeparate: 'herdReasonKeptSeparate',
    other: 'herdReasonOther',
    onlyHerd: 'herdReasonOnlyHerd'
  }

  const allReasonsFalse = {
    herdReasonManagementNeeds: false,
    herdReasonUniqueHealth: false,
    herdReasonDifferentBreed: false,
    herdReasonOtherPurpose: false,
    herdReasonKeptSeparate: false,
    herdReasonOnlyHerd: false,
    herdReasonOther: false
  }

  const reasonScenarios = [...Object.keys(MULTIPLE_HERD_REASONS), 'onlyHerd'].map((reason) => ({
    reason,
    change: { ...herdChange, newValue: [reason] },
    expectedFlags: { ...allReasonsFalse, [flagForReason[reason]]: true }
  }))

  test('We can change a herd field', async () => {
    const results = await processChanges([herdChange], mockDb, mockLogger)

    expect(results[0]).toEqual({ ...herdChange, success: true })
    expect(mockLogger.info).toHaveBeenCalledWith(
      `${herdChange.claimRef} has processed successfully`
    )
  })

  test.each(reasonScenarios)(
    'When we change a herd field to "$reason", the herd gets changed',
    async ({ reason, change }) => {
      await processChanges([change], mockDb, mockLogger)

      expect(mockDb.collection).toHaveBeenCalledWith(HERDS_COLLECTION)
      // The current herd version is read
      expect(mockFindOne).toHaveBeenCalledWith({ id: 'herd-abc-123', isCurrent: true })
      // The current herd version is no longer marked as current
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { id: 'herd-abc-123', version: 1 },
        { $set: { isCurrent: false } }
      )
      // A new herd version is created carrying the new reasons
      expect(mockInsertOne).toHaveBeenCalledWith({
        id: 'herd-abc-123',
        version: 2,
        applicationReference: herdChange.applicationRef,
        name: 'Commercial Herd',
        species: 'beef',
        cph: '12/345/6789',
        reasons: [reason],
        isCurrent: true,
        createdBy: 'Admin2',
        updatedAt: {},
        createdAt: expect.any(Date)
      })
    }
  )

  test.each(reasonScenarios)(
    'When we change a herd field to "$reason", the claim is updated with the new herd version',
    async ({ change }) => {
      await processChanges([change], mockDb, mockLogger)

      expect(mockDb.collection).toHaveBeenCalledWith(CLAIMS_COLLECTION)
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { reference: herdChange.claimRef },
        {
          $set: {
            'herd.id': 'herd-abc-123',
            'herd.version': 2,
            'herd.associatedAt': expect.any(Date),
            'herd.name': 'Commercial Herd',
            'herd.cph': '12/345/6789',
            'herd.reasons': change.newValue,
            updatedBy: 'Admin2',
            updatedAt: expect.any(Date)
          },
          $push: {
            updateHistory: {
              id: expect.any(String),
              note: `Requested on ${herdChange.dateRequested} by ${herdChange.requester}`,
              updatedProperty: herdChange.field,
              newValue: change.newValue,
              oldValue: herdChange.oldValue,
              eventType: 'claim-herdReasons',
              createdBy: 'Admin2',
              createdAt: expect.any(Date)
            }
          }
        }
      )
    }
  )

  test.each(reasonScenarios)(
    'When we change a herd field to "$reason", a herd event for the new version is sent',
    async ({ change, expectedFlags }) => {
      await processChanges([change], mockDb, mockLogger)

      expect(mockPublishEvent).toHaveBeenCalledWith({
        name: 'send-session-event',
        id: expect.any(String),
        sbi: herdChange.sbi,
        cph: 'n/a',
        checkpoint: expect.any(String),
        status: 'success',
        type: 'herd-versionCreated',
        message: 'New herd version created',
        data: {
          herdId: 'herd-abc-123',
          herdVersion: 2,
          herdName: 'Commercial Herd',
          herdSpecies: 'beef',
          herdCph: '12/345/6789',
          ...expectedFlags
        },
        raisedBy: 'Admin2',
        raisedOn: expect.any(String)
      })
    }
  )

  test('When we change a herd field, a herd event for the change is sent', async () => {
    await processChanges([herdChange], mockDb, mockLogger)

    expect(mockPublishEvent).toHaveBeenCalledWith({
      name: 'send-session-event',
      id: expect.any(String),
      sbi: herdChange.sbi,
      cph: 'n/a',
      checkpoint: expect.any(String),
      status: 'success',
      type: 'claim-herdAssociated',
      message: 'Herd associated with claim updated',
      data: {
        herdId: 'herd-abc-123',
        herdVersion: 2,
        reference: herdChange.claimRef,
        applicationReference: herdChange.applicationRef
      },
      raisedBy: 'Admin2',
      raisedOn: expect.any(String)
    })
  })

  test('If an error is thrown, we return no success', async () => {
    mockFindOne.mockReset()
    mockFindOne.mockRejectedValue(new Error('Connection failed'))
    const results = await processChanges([herdChange], mockDb, mockLogger)

    expect(results[0]).toEqual({
      ...herdChange,
      success: false,
      reason: 'Connection failed'
    })
    expect(mockLogger.info).toHaveBeenCalledWith(
      `${herdChange.claimRef} has failed because Connection failed`
    )
  })
})

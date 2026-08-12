import Hapi from '@hapi/hapi'
import { claimHistoryHandlers } from './claim-history.js'
import { getClaimByReference } from '../../repositories/claim-repository.js'
import { getApplicationWithFullFlags } from '../../repositories/application-repository.js'
import { getWithdrawalRequestByClaimReference } from '../../repositories/withdrawal-request-repository.js'

jest.mock('../../repositories/application-repository')
jest.mock('../../repositories/claim-repository')
jest.mock('../../repositories/withdrawal-request-repository')

const mockLogger = {
  info: jest.fn(() => {}),
  warn: jest.fn(() => {}),
  error: jest.fn(() => {}),
  debug: jest.fn(() => {}),
  setBindings: jest.fn(() => {})
}
const mockDb = jest.fn()

const createServer = async () => {
  const server = Hapi.server({
    port: 0,
    host: 'localhost'
  })
  server.route(claimHistoryHandlers)

  await server.initialize()
  server.decorate('request', 'logger', mockLogger)
  server.decorate('request', 'db', mockDb)

  return server
}

describe('Claim history test', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  const statusHistory = [
    {
      note: 'in check',
      status: 'IN_CHECK',
      createdBy: 'Daniel Jones',
      createdAt: new Date('2023-03-23T10:00:12.000Z')
    },
    {
      note: 'rejected',
      status: 'REJECTED',
      createdBy: 'Amanda Hassan',
      createdAt: new Date('2023-03-25T11:10:15.000Z')
    }
  ]

  const updateHistory = [
    {
      note: 'test',
      updatedProperty: 'visitDate',
      newValue: '2025-03-03T00:00:00.000Z',
      oldValue: '2025-03-18T00:00:00.000Z',
      eventType: 'claim-visitDate',
      createdAt: new Date('2023/03/24'),
      createdBy: 'Mr Test'
    }
  ]

  const flags = [
    {
      id: '333c18ef-fb26-4beb-ac87-c483fc886fea',
      note: 'Flag this please',
      createdBy: 'Tom',
      createdAt: new Date('2025-04-09T11:59:54.075Z'),
      appliesToMh: false,
      deletedAt: null,
      deletedBy: null
    },
    {
      id: '53dbbc6c-dd14-4d01-be11-ad288cb16b08',
      note: 'Flag this please',
      createdBy: 'Ben',
      createdAt: new Date('2025-04-09T12:01:23.322Z'),
      appliesToMh: true,
      deletedAt: new Date('2025-04-10T12:01:23.322Z'),
      deletedBy: 'Ben'
    }
  ]

  getClaimByReference.mockResolvedValue({ statusHistory, updateHistory })
  getApplicationWithFullFlags.mockResolvedValue({ flags })

  test('returns historyRecords', async () => {
    const options = {
      method: 'GET',
      url: '/api/claims/REBC-VA4R-TRL7/history'
    }
    const res = await server.inject(options)

    const expectedHistoryRecords = [
      {
        eventType: 'status-updated',
        newValue: 'IN_CHECK',
        note: 'in check',
        updatedAt: '2023-03-23T10:00:12.000Z',
        updatedBy: 'Daniel Jones',
        updatedProperty: 'status'
      },
      {
        eventType: 'claim-visitDate',
        newValue: '2025-03-03T00:00:00.000Z',
        note: 'test',
        oldValue: '2025-03-18T00:00:00.000Z',
        updatedAt: '2023-03-24T00:00:00.000Z',
        updatedBy: 'Mr Test',
        updatedProperty: 'visitDate'
      },
      {
        eventType: 'status-updated',
        newValue: 'REJECTED',
        note: 'rejected',
        updatedAt: '2023-03-25T11:10:15.000Z',
        updatedBy: 'Amanda Hassan',
        updatedProperty: 'status'
      },
      {
        eventType: 'Agreement flagged (non-Multiple Herds)',
        newValue: 'Flagged (non-Multiple Herds)',
        note: 'Flag this please',
        oldValue: 'Unflagged',
        updatedAt: '2025-04-09T11:59:54.075Z',
        updatedBy: 'Tom',
        updatedProperty: 'agreementFlag'
      },
      {
        eventType: 'Agreement flagged (Multiple Herds)',
        newValue: 'Flagged (Multiple Herds)',
        note: 'Flag this please',
        oldValue: 'Unflagged',
        updatedAt: '2025-04-09T12:01:23.322Z',
        updatedBy: 'Ben',
        updatedProperty: 'agreementFlag'
      },
      {
        eventType: 'Agreement unflagged (Multiple Herds)',
        newValue: 'Unflagged (Multiple Herds)',
        oldValue: 'Flagged',
        updatedAt: '2025-04-10T12:01:23.322Z',
        updatedBy: 'Ben',
        updatedProperty: 'agreementFlag'
      }
    ]

    expect(JSON.parse(res.payload)).toEqual({ historyRecords: expectedHistoryRecords })
  })

  test('attaches withdrawal details to the withdrawn status record', async () => {
    getClaimByReference.mockResolvedValueOnce({
      applicationReference: 'IAHW-1234-APP1',
      statusHistory: [
        {
          note: 'in check',
          status: 'IN_CHECK',
          createdBy: 'Daniel Jones',
          createdAt: new Date('2023-03-23T10:00:12.000Z')
        },
        {
          note: 'Withdrawal requested',
          status: 'WITHDRAWN',
          createdBy: 'Amanda Hassan',
          createdAt: new Date('2023-03-25T11:10:15.000Z')
        }
      ],
      updateHistory: []
    })
    getApplicationWithFullFlags.mockResolvedValueOnce({ flags: [] })
    getWithdrawalRequestByClaimReference.mockResolvedValueOnce({
      reasonForWithdrawal: 'unintentionalTypingError',
      issueDiscovery: 'customerContactedRPA',
      withdrawalDetails: 'The date of visit was a typo'
    })

    const res = await server.inject({
      method: 'GET',
      url: '/api/claims/REBC-VA4R-TRL7/history'
    })

    expect(getWithdrawalRequestByClaimReference).toHaveBeenCalledWith({
      db: mockDb,
      claimReference: 'REBC-VA4R-TRL7'
    })
    expect(JSON.parse(res.payload)).toEqual({
      historyRecords: [
        {
          eventType: 'status-updated',
          newValue: 'IN_CHECK',
          note: 'in check',
          updatedAt: '2023-03-23T10:00:12.000Z',
          updatedBy: 'Daniel Jones',
          updatedProperty: 'status'
        },
        {
          eventType: 'status-updated',
          newValue: 'WITHDRAWN',
          note: 'Withdrawal requested',
          updatedAt: '2023-03-25T11:10:15.000Z',
          updatedBy: 'Amanda Hassan',
          updatedProperty: 'status',
          withdrawal: {
            reasonForWithdrawal: 'unintentionalTypingError',
            issueDiscovery: 'customerContactedRPA',
            withdrawalDetails: 'The date of visit was a typo'
          }
        }
      ]
    })
  })

  test('leaves the withdrawn status record unchanged when no withdrawal request exists', async () => {
    getClaimByReference.mockResolvedValueOnce({
      applicationReference: 'IAHW-1234-APP1',
      statusHistory: [
        {
          note: 'Withdrawal requested',
          status: 'WITHDRAWN',
          createdBy: 'Amanda Hassan',
          createdAt: new Date('2023-03-25T11:10:15.000Z')
        }
      ],
      updateHistory: []
    })
    getApplicationWithFullFlags.mockResolvedValueOnce({ flags: [] })
    getWithdrawalRequestByClaimReference.mockResolvedValueOnce(null)

    const res = await server.inject({
      method: 'GET',
      url: '/api/claims/REBC-VA4R-TRL7/history'
    })

    expect(getWithdrawalRequestByClaimReference).toHaveBeenCalledWith({
      db: mockDb,
      claimReference: 'REBC-VA4R-TRL7'
    })
    expect(JSON.parse(res.payload)).toEqual({
      historyRecords: [
        {
          eventType: 'status-updated',
          newValue: 'WITHDRAWN',
          note: 'Withdrawal requested',
          updatedAt: '2023-03-25T11:10:15.000Z',
          updatedBy: 'Amanda Hassan',
          updatedProperty: 'status'
        }
      ]
    })
  })
})

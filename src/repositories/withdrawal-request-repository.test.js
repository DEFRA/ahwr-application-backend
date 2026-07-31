import {
  createWithdrawalRequestIndexes,
  createWithdrawalRequest
} from './withdrawal-request-repository.js'
import { WITHDRAWAL_REQUESTS_COLLECTION } from '../constants/index.js'

describe('withdrawal-request-repository', () => {
  describe('createWithdrawalRequestIndexes', () => {
    it('should create an index on each of the three references', async () => {
      const mockCreateIndex = jest.fn()
      const mockCollection = { createIndex: mockCreateIndex }
      const mockDb = { collection: jest.fn(() => mockCollection) }

      await createWithdrawalRequestIndexes(mockDb)

      expect(mockDb.collection).toHaveBeenCalledWith(WITHDRAWAL_REQUESTS_COLLECTION)
      expect(mockCreateIndex).toHaveBeenCalledWith({ claimReference: 1 })
      expect(mockCreateIndex).toHaveBeenCalledWith({ agreementReference: 1 })
      expect(mockCreateIndex).toHaveBeenCalledWith({ sbi: 1 })
    })
  })

  describe('createWithdrawalRequest', () => {
    it('should insert the withdrawal request into the collection', async () => {
      const mockInsertOne = jest.fn().mockResolvedValue({ insertedId: 'abc' })
      const mockCollection = { insertOne: mockInsertOne }
      const mockDb = { collection: jest.fn(() => mockCollection) }
      const withdrawalRequest = {
        claimReference: 'REBC-VA4R-TRL7',
        agreementReference: 'IAHW-1234-APP1',
        sbi: '123456789',
        reasonForWithdrawal: 'unintentionalTypingError',
        issueDiscovery: 'customerContactedRPA',
        withdrawalDetails: 'The date of visit was a typo'
      }

      const result = await createWithdrawalRequest({ db: mockDb, withdrawalRequest })

      expect(mockDb.collection).toHaveBeenCalledWith(WITHDRAWAL_REQUESTS_COLLECTION)
      expect(mockInsertOne).toHaveBeenCalledWith(withdrawalRequest)
      expect(result).toEqual({ insertedId: 'abc' })
    })
  })
})

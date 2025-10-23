import { isURNUnique } from './ow-application-repository.js'

describe('isURNUnique', () => {
  const mockDb = {
    collection: jest.fn(() => mockCollection)
  }
  const mockCollection = {
    findOne: jest.fn()
  }
  const sbi = '123456789'
  const laboratoryURN = 'URN34567ddd'

  it('should return true if no matching document is found', async () => {
    mockCollection.findOne.mockResolvedValue(null)

    const result = await isURNUnique({ db: mockDb, sbi, laboratoryURN })

    expect(mockDb.collection).toHaveBeenCalledWith('owapplications')
    expect(mockCollection.findOne).toHaveBeenCalledWith({
      'organisation.sbi': sbi,
      'data.urnResult': { $regex: `^${laboratoryURN}$`, $options: 'i' }
    })
    expect(result).toBe(true)
  })

  it('should return false if a matching document is found', async () => {
    mockCollection.findOne.mockResolvedValue({
      id: '95598de8-c0fa-4ba2-bb8f-17bc746e305d'
    })

    const result = await isURNUnique({ db: mockDb, sbi, laboratoryURN })

    expect(result).toBe(false)
  })
})

import { deleteDataForSbis } from './cleanup-repository.js'

describe('deleteDataForSbis', () => {
  let mockDb
  let mockApplicationsCollection
  let mockHerdsCollection
  let mockClaimsCollection

  beforeEach(() => {
    mockApplicationsCollection = {
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      deleteMany: jest.fn()
    }

    mockHerdsCollection = { deleteMany: jest.fn() }
    mockClaimsCollection = { deleteMany: jest.fn() }

    mockDb = {
      collection: jest.fn((name) => {
        if (name === 'applications') return mockApplicationsCollection
        if (name === 'herds') return mockHerdsCollection
        if (name === 'claims') return mockClaimsCollection
      })
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns 0 counts if no applications found', async () => {
    mockApplicationsCollection.toArray.mockResolvedValue([])

    const result = await deleteDataForSbis(['123'], mockDb)

    expect(result).toEqual({
      applicationsDeleted: 0,
      herdsDeleted: 0,
      claimsDeleted: 0
    })
    expect(mockApplicationsCollection.find).toHaveBeenCalledWith(
      { 'organisation.sbi': { $in: ['123'] } },
      { projection: { reference: 1 } }
    )
  })

  it('deletes related herds, claims, and applications', async () => {
    const appRefs = ['APP-1', 'APP-2']
    mockApplicationsCollection.toArray.mockResolvedValue([
      { reference: 'APP-1' },
      { reference: 'APP-2' }
    ])

    mockHerdsCollection.deleteMany.mockResolvedValue({ deletedCount: 5 })
    mockClaimsCollection.deleteMany.mockResolvedValue({ deletedCount: 3 })
    mockApplicationsCollection.deleteMany.mockResolvedValue({ deletedCount: 2 })

    const result = await deleteDataForSbis(['123', '456'], mockDb)

    expect(mockDb.collection).toHaveBeenCalledWith('herds')
    expect(mockDb.collection).toHaveBeenCalledWith('claims')
    expect(mockDb.collection).toHaveBeenCalledWith('applications')

    expect(mockHerdsCollection.deleteMany).toHaveBeenCalledWith({
      applicationReference: { $in: appRefs }
    })
    expect(mockClaimsCollection.deleteMany).toHaveBeenCalledWith({
      applicationReference: { $in: appRefs }
    })
    expect(mockApplicationsCollection.deleteMany).toHaveBeenCalledWith({
      reference: { $in: appRefs }
    })

    expect(result).toEqual({
      applicationsDeleted: 2,
      herdsDeleted: 5,
      claimsDeleted: 3
    })
  })
})

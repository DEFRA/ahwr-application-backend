import {
  getAllByApplicationReference,
  updateApplicationValuesAndContactHistory
} from './contact-history-repository.js'

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid')
}))

describe('getAllByApplicationReference', () => {
  const mockDb = {
    collection: jest.fn(() => mockCollection)
  }
  const mockCollection = {
    findOne: jest.fn()
  }
  const applicationReference = 'IAHW-8ZPZ-8CLI'

  it('should return result if document is found', async () => {
    const resultObject = {
      contactHistory: [
        {
          oldValue: 'notreal@madeitup.com',
          newValue: 'something@else.com',
          field: 'email'
        }
      ]
    }
    mockCollection.findOne.mockResolvedValue(resultObject)
    const collection = 'applications'

    const result = await getAllByApplicationReference(mockDb, applicationReference, collection)

    expect(mockDb.collection).toHaveBeenCalledWith(collection)
    expect(mockCollection.findOne).toHaveBeenCalledWith(
      {
        reference: applicationReference
      },
      { projection: { _id: 0, contactHistory: 1 } }
    )
    expect(result).toBe(resultObject)
  })
})

describe('updateApplicationValuesAndContactHistory', () => {
  const mockDb = {
    collection: jest.fn()
  }
  const mockCollection = {
    findOneAndUpdate: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.collection.mockReturnValue(mockCollection)
  })

  it('should update application values and contact history', async () => {
    const createdAt = new Date('2024-11-20T13:51:24.291Z')

    await updateApplicationValuesAndContactHistory({
      collection: 'applications',
      db: mockDb,
      reference: 'IAHW-JTTU-SDQ7',
      contactHistory: [
        {
          createdAt,
          crn: '0123456789',
          field: 'farmerName',
          newValue: 'John Farmer',
          oldValue: 'Jane Farmer',
          personRole: 'Agent'
        }
      ],
      updatedAt: createdAt,
      user: 'admin',
      updatedPropertyPathsAndValues: {
        'organisation.crn': '0123456789',
        'organisation.farmerName': 'John Farmer'
      }
    })

    expect(mockDb.collection).toHaveBeenCalledWith('applications')
    expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
      { reference: 'IAHW-JTTU-SDQ7' },
      {
        $set: {
          'organisation.crn': '0123456789',
          'organisation.farmerName': 'John Farmer',
          updatedAt: createdAt,
          updatedBy: 'admin'
        },
        $push: {
          contactHistory: {
            $each: [
              {
                createdAt,
                crn: '0123456789',
                field: 'farmerName',
                newValue: 'John Farmer',
                oldValue: 'Jane Farmer',
                personRole: 'Agent'
              }
            ]
          }
        }
      },
      { returnDocument: 'after' }
    )
  })
})

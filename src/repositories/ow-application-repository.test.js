import { isURNUnique, getApplication } from './ow-application-repository.js'

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

describe('getApplication', () => {
  const mockDb = {
    collection: jest.fn()
  }
  const mockCollection = {
    findOne: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.collection.mockReturnValue(mockCollection)
  })

  it('should return application that matches reference', async () => {
    const mockApp = {
      reference: 'AHWR-B571-6E79',
      createdAt: new Date('2023-09-21T21:11:02.776Z'),
      updatedAt: new Date('2024-11-20T13:51:24.283Z'),
      createdBy: 'admin',
      updatedBy: 'admin',
      data: {
        vetName: 'Mr CowWhisperer',
        vetRcvs: '1208642',
        urnResult: '355981',
        visitDate: new Date('2023-11-10T00:00:00.000Z'),
        dateOfClaim: new Date('2023-11-23T20:17:43.694Z'),
        declaration: true,
        offerStatus: 'accepted',
        whichReview: 'beef',
        dateOfTesting: new Date('2023-11-10T00:00:00.000Z'),
        detailsCorrect: 'yes',
        eligibleSpecies: 'yes',
        confirmCheckDetails: 'yes'
      },
      organisation: {
        sbi: '123456789',
        name: 'Mr madeup',
        email: 'karengilberta@trebligneraky.com.test',
        address:
          'Forest View Farm,PAYHEMBURY,CLAYTONS FARM,LITTLE LONDON,NEWBURY,GL3 4RA,United Kingdom',
        orgEmail: 'burdassfrz@rfssadrubj.com.test',
        farmerName: 'Karen Gilbert'
      },
      status: 'READY_TO_PAY',
      statusHistory: [],
      updateHistory: [],
      contactHistory: [
        {
          id: '7e4dca92-2ee8-4420-8efc-eec7daafd26b',
          field: 'email',
          newValue: 'karengilberta@trebligneraky.com.test',
          oldValue: 'notreal@madeitup.com',
          createdAt: new Date('2024-11-20T13:51:24.291Z')
        }
      ],
      redactionHistory: {},
      flags: [],
      claimed: false,
      eligiblePiiRedaction: true
    }
    mockCollection.findOne.mockResolvedValue(mockApp)

    const result = await getApplication(mockDb, 'AHWR-B571-6E79')

    expect(mockDb.collection).toHaveBeenCalledWith('owapplications')
    expect(mockCollection.findOne).toHaveBeenCalledWith({
      reference: 'AHWR-B571-6E79'
    })
    expect(result).toEqual(mockApp)
  })

  it('should return null if no application is found', async () => {
    mockCollection.findOne.mockResolvedValue(null)

    const result = await getApplication(mockDb, 'AHWR-B571-6E79')

    expect(result).toBeNull()
  })

  it('should propagate errors from the database', async () => {
    const error = new Error('Database error')
    mockCollection.findOne.mockRejectedValue(error)

    await expect(getApplication(mockDb, 'AHWR-B571-6E79')).rejects.toThrow(
      'Database error'
    )
  })
})

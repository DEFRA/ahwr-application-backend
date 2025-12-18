import {
  isOWURNUnique,
  getOWApplication,
  updateOWApplication,
  updateOWApplicationStatus,
  getOWApplicationsBySbi
} from './ow-application-repository.js'

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid')
}))

describe('isOWURNUnique', () => {
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

    const result = await isOWURNUnique({ db: mockDb, sbi, laboratoryURN })

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

    const result = await isOWURNUnique({ db: mockDb, sbi, laboratoryURN })

    expect(result).toBe(false)
  })
})

describe('getOWApplication', () => {
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

    const result = await getOWApplication(mockDb, 'AHWR-B571-6E79')

    expect(mockDb.collection).toHaveBeenCalledWith('owapplications')
    expect(mockCollection.findOne).toHaveBeenCalledWith({
      reference: 'AHWR-B571-6E79'
    })
    expect(result).toEqual(mockApp)
  })

  it('should return null if no application is found', async () => {
    mockCollection.findOne.mockResolvedValue(null)

    const result = await getOWApplication(mockDb, 'AHWR-B571-6E79')

    expect(result).toBeNull()
  })

  it('should propagate errors from the database', async () => {
    const error = new Error('Database error')
    mockCollection.findOne.mockRejectedValue(error)

    await expect(getOWApplication(mockDb, 'AHWR-B571-6E79')).rejects.toThrow('Database error')
  })
})

describe('updateOWApplication', () => {
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

  it('should update application property and history', async () => {
    const updatedAt = new Date('2024-11-20T13:51:24.291Z')

    await updateOWApplication({
      db: mockDb,
      reference: 'AHWR-B571-6E79',
      updatedPropertyPath: 'data.vetsName',
      newValue: 'Jane',
      oldValue: 'John',
      note: 'Status updated',
      user: 'test-user',
      updatedAt
    })

    expect(mockDb.collection).toHaveBeenCalledWith('owapplications')
    expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
      { reference: 'AHWR-B571-6E79' },
      {
        $set: {
          'data.vetsName': 'Jane',
          updatedAt,
          updatedBy: 'test-user'
        },
        $push: {
          updateHistory: {
            id: 'mocked-uuid',
            note: 'Status updated',
            newValue: 'Jane',
            oldValue: 'John',
            createdAt: updatedAt,
            createdBy: 'test-user',
            eventType: `application-vetsName`,
            updatedProperty: 'vetsName'
          }
        }
      }
    )
  })
})

describe('updateOWApplicationStatus', () => {
  const mockDb = {
    collection: jest.fn(() => mockCollection)
  }
  const mockCollection = {
    findOneAndUpdate: jest.fn()
  }
  it('should call findOneAndUpdate with correct parameters and return result', async () => {
    const updatedApplication = {
      reference: 'IAHW-8ZPZ-8CLI',
      status: 'WITHDRAWN',
      updatedBy: 'test-user',
      updatedAt: new Date('2025-10-22T16:21:46.091Z'),
      statusHistory: [
        {
          status: 'AGREED',
          createdBy: 'admin',
          createdAt: new Date('2025-10-22T16:21:46.091Z')
        }
      ]
    }
    mockCollection.findOneAndUpdate.mockResolvedValue(updatedApplication)

    const result = await updateOWApplicationStatus({
      db: mockDb,
      reference: 'IAHW-8ZPZ-8CLI',
      status: 'WITHDRAWN',
      user: 'test-user',
      updatedAt: new Date('2025-10-22T16:21:46.091Z')
    })

    expect(mockDb.collection).toHaveBeenCalledWith('owapplications')
    expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
      { reference: 'IAHW-8ZPZ-8CLI' },
      {
        $set: {
          status: 'WITHDRAWN',
          updatedBy: 'test-user',
          updatedAt: new Date('2025-10-22T16:21:46.091Z')
        },
        $push: {
          statusHistory: {
            status: 'WITHDRAWN',
            createdAt: new Date('2025-10-22T16:21:46.091Z'),
            createdBy: 'test-user'
          }
        }
      },
      { returnDocument: 'after' }
    )
    expect(result).toBe(updatedApplication)
  })
})

describe('getOWApplicationsBySbi', () => {
  const mockCollection = {
    toArray: jest.fn(),
    find: jest.fn().mockReturnThis(),
    aggregate: jest.fn().mockReturnThis()
  }
  const dbMock = {
    collection: jest.fn(() => mockCollection)
  }
  it('should return applications that match sbi in descending order', async () => {
    const mockResult = [
      {
        reference: 'AHWR-8ZPZ-8CLI',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        createdBy: 'admin',
        updatedBy: 'user2',
        data: {
          reference: 'TEMP-8ZPZ-8CLI',
          declaration: true,
          offerStatus: 'accepted',
          confirmCheckDetails: 'yes'
        },
        organisation: {
          crn: '1101489790',
          sbi: '118409263',
          name: 'High Oustley Farm',
          email: 'jparkinsong@nosnikrapjz.com.test',
          address:
            'THE FIRS,South Croxton Road,HULVER FARM,MAIN STREET,MALVERN,TS21 2HU,United Kingdom',
          orgEmail: 'highoustleyfarmm@mrafyeltsuohgihh.com.test',
          userType: 'newUser',
          farmerName: 'J Parkinson'
        },
        status: 'AGREED',
        flags: [{ appliesToMh: true }],
        redacted: false,
        claimed: true
      }
    ]
    mockCollection.toArray.mockResolvedValue(mockResult)
    const sbi = '123456789'

    const result = await getOWApplicationsBySbi(dbMock, sbi)

    expect(dbMock.collection).toHaveBeenCalledWith('owapplications')
    expect(mockCollection.aggregate).toHaveBeenCalledWith(expect.any(Array))
    expect(result).toEqual(mockResult)
  })
})

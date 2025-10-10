import {
  getApplicationsBySbi,
  getLatestApplicationBySbi,
  createApplication
} from './application-repository'

describe('application-repository', () => {
  let dbMock
  let collectionMock

  beforeEach(() => {
    collectionMock = {
      aggregate: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
      find: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      next: vi.fn(),
      insertOne: vi.fn()
    }

    dbMock = {
      collection: vi.fn(() => collectionMock)
    }
  })

  describe('getApplicationsBySbi', () => {
    it('should return applications that matches sbi in descending order', async () => {
      const mockResult = [
        {
          reference: 'IAHW-8ZPZ-8CLI',
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
          redacted: true
        }
      ]
      collectionMock.toArray.mockResolvedValue(mockResult)
      const sbi = '123456789'

      const result = await getApplicationsBySbi(dbMock, sbi)

      expect(dbMock.collection).toHaveBeenCalledWith('applications')
      expect(collectionMock.aggregate).toHaveBeenCalledWith(expect.any(Array))
      expect(result).toEqual(mockResult)
    })
  })

  describe('getLatestApplicationBySbi', () => {
    it('should return latest application that matches sbi from db', async () => {
      const mockApplication = { reference: 'IAHW-8ZPZ-8CLI' }
      collectionMock.next.mockResolvedValue(mockApplication)
      const sbi = '123456789'

      const result = await getLatestApplicationBySbi(dbMock, sbi)

      expect(dbMock.collection).toHaveBeenCalledWith('applications')
      expect(collectionMock.find).toHaveBeenCalledWith({
        'organisation.sbi': sbi
      })
      expect(collectionMock.sort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(collectionMock.limit).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockApplication)
    })
  })

  describe('createApplication', () => {
    it('should create application in db', async () => {
      const application = { reference: 'newApp' }
      const mockInsertResult = { acknowledged: true, insertedId: '1' }
      collectionMock.insertOne.mockResolvedValue(mockInsertResult)

      const result = await createApplication(dbMock, application)

      expect(dbMock.collection).toHaveBeenCalledWith('applications')
      expect(collectionMock.insertOne).toHaveBeenCalledWith(application)
      expect(result).toEqual(mockInsertResult)
    })
  })
})

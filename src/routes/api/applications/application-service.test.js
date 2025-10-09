import * as repo from './application-repository.js'
import { getApplications } from './application-service.js'

describe('application-service', () => {
  const mockLogger = {
    setBindings: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getApplications', () => {
    it('should return applications when applications exist for sbi in repo', async () => {
      const mockResult = [
        {
          reference: 'IAHW-8ZPZ-8CLI',
          data: {
            reference: 'IAHW-8ZPZ-8CLI',
            declaration: true,
            offerStatus: 'accepted',
            confirmCheckDetails: 'yes'
          },
          status: 'AGREED',
          createdAt: '2025-01-01T00:00:00Z',
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
          redacted: false
        }
      ]
      vi.spyOn(repo, 'getApplicationsBySbi').mockResolvedValue(mockResult)

      const result = await getApplications({
        sbi: '123456789',
        logger: mockLogger,
        db: {}
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({ sbi: '123456789' })
      expect(repo.getApplicationsBySbi).toHaveBeenCalledWith({}, '123456789')
      expect(result).toEqual([
        {
          type: 'EE',
          reference: 'IAHW-8ZPZ-8CLI',
          data: {
            reference: 'IAHW-8ZPZ-8CLI',
            declaration: true,
            offerStatus: 'accepted',
            confirmCheckDetails: 'yes'
          },
          status: 'AGREED',
          createdAt: '2025-01-01T00:00:00Z',
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
          redacted: false
        }
      ])
    })

    it('should return empty array when no applications exist for sbi in repo', async () => {
      vi.spyOn(repo, 'getApplicationsBySbi').mockResolvedValue([])

      const result = await getApplications({
        sbi: '123456789',
        logger: mockLogger,
        db: {}
      })

      expect(mockLogger.setBindings).toHaveBeenCalledWith({ sbi: '123456789' })
      expect(repo.getApplicationsBySbi).toHaveBeenCalledWith({}, '123456789')
      expect(result).toEqual([])
    })
  })
})

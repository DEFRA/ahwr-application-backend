import {
  getApplicationsBySbi,
  createApplication,
  getRemindersToSend,
  updateReminders
} from './application-repository'
// import { applicationStatus } from '../../../../app/constants/index.js'

describe('application-repository', () => {
  const dbMock = {
    collection: jest.fn(() => collectionMock)
  }
  const collectionMock = {
    aggregate: jest.fn().mockReturnThis(),
    toArray: jest.fn(),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    next: jest.fn(),
    insertOne: jest.fn()
  }

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

  describe('createApplication', () => {
    it('should create application in db', async () => {
      const application = { reference: 'IAHW-8ZPZ-8CLI' }
      const mockInsertResult = { acknowledged: true, insertedId: '1' }
      collectionMock.insertOne.mockResolvedValue(mockInsertResult)

      const result = await createApplication(dbMock, application)

      expect(dbMock.collection).toHaveBeenCalledWith('applications')
      expect(collectionMock.insertOne).toHaveBeenCalledWith(application)
      expect(result).toEqual(mockInsertResult)
    })
  })

  // TODO BH impl
  describe('getRemindersToSend', () => {
    const mockLogger = {
      info: jest.fn()
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('get applications due notClaimed_threeMonths reminders, documents input, expected query structure and expected output', async () => {
      const fakeMaxBatchSize = 5000
      // const { notAgreed } = applicationStatus
      // models.application.findAll.mockResolvedValueOnce([
      //   { dataValues: { reference: 'IAHW-BEKR-TEST', crn: '1000000000', sbi: '100000000', email: 'dummy@example.com', orgEmail: undefined, reminders: undefined, reminderType: 'notClaimed_threeMonths' } }
      // ])

      const reminders = await getRemindersToSend(
        'notClaimed_threeMonths',
        '2025-08-05T00:00:00.000Z',
        '2024-05-05T00:00:00.000Z',
        ['notClaimed_sixMonths', 'notClaimed_nineMonths'],
        fakeMaxBatchSize,
        mockLogger
      )

      // expect(models.application.findAll).toHaveBeenCalledWith(
      //   {
      //     where: {
      //       type: {
      //         [Op.eq]: 'EE'
      //       },
      //       reference: {
      //         [Op.notIn]: {
      //           val: '(SELECT DISTINCT "applicationReference" FROM claim)'
      //         }
      //       },
      //       statusId: {
      //         [Op.ne]: notAgreed
      //       },
      //       createdAt: {
      //         [Op.lte]: '2025-08-05T00:00:00.000Z',
      //         [Op.gte]: '2024-05-05T00:00:00.000Z'
      //       },
      //       reminders: {
      //         [Op.notIn]: ['notClaimed_threeMonths', 'notClaimed_sixMonths', 'notClaimed_nineMonths']
      //       }
      //     },
      //     attributes: [
      //       'reference',
      //       [{ val: "data->'organisation'->>'crn'" }, 'crn'],
      //       [{ val: "data->'organisation'->>'sbi'" }, 'sbi'],
      //       [{ val: "data->'organisation'->>'email'" }, 'email'],
      //       [{ val: "data->'organisation'->>'orgEmail'" }, 'orgEmail'],
      //       'reminders',
      //       [{ val: "'notClaimed_threeMonths'" }, 'reminderType'],
      //       'createdAt'
      //     ],
      //     order: [['createdAt', 'ASC']],
      //     limit: fakeMaxBatchSize
      //   }
      // )
      expect(mockLogger.info).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Getting reminders due, reminder type 'notClaimed_threeMonths', window start '2025-08-05T00:00:00.000Z', end '2024-05-05T00:00:00.000Z' and haven't already received later reminders 'notClaimed_sixMonths,notClaimed_nineMonths'"
      )
      expect(reminders).toHaveLength(0) // TODO BH switch back to 1
    })
  })

  // TODO BH impl
  describe('updateReminders', () => {
    const mockLogger = {
      info: jest.fn()
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('updates reminders on application', async () => {
      // models.application.update.mockResolvedValueOnce([1])

      await updateReminders(
        'IAHW-5BA2-6DFD',
        'notClaimed_nineMonths',
        undefined,
        mockLogger
      )

      // expect(models.application.update).toHaveBeenCalledWith(
      //   { reminders: 'notClaimed_nineMonths' },
      //   {
      //     where: {
      //       reference: 'IAHW-5BA2-6DFD'
      //     },
      //     returning: true
      //   }
      // )
      // expect(models.application_update_history.create).toHaveBeenCalledWith({
      //   eventType: 'application-reminders',
      //   updatedProperty: 'reminders',
      //   note: 'Reminder sent',
      //   applicationReference: 'IAHW-5BA2-6DFD',
      //   newValue: 'notClaimed_nineMonths',
      //   oldValue: undefined,
      //   createdBy: 'admin'
      // })
      expect(mockLogger.info).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully updated reminders, rows affected: 0' // TODO BH switch back to 1
      )
    })
  })
})

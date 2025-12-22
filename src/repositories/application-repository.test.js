import { STATUS, reminders as reminderTypes } from 'ffc-ahwr-common-library'
import {
  getApplicationsBySbi,
  createApplication,
  getRemindersToSend,
  updateReminders,
  updateApplication,
  searchApplications
} from './application-repository'
import { flagNotDeletedFilter } from './common.js'

describe('application-repository', () => {
  const dbMock = {
    collection: jest.fn(() => collectionMock)
  }
  const collectionMock = {
    aggregate: jest.fn().mockReturnThis(),
    toArray: jest.fn(),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    project: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    next: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(() => ({ modifiedCount: 1 })),
    findOneAndUpdate: jest.fn()
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

  describe('getRemindersToSend', () => {
    const mockLogger = {
      info: jest.fn()
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('get applications due notClaimed_threeMonths reminders, documents input, expected query structure and expected output', async () => {
      const fakeMaxBatchSize = 5000
      const { threeMonths, sixMonths, nineMonths } = reminderTypes.notClaimed
      const { NOT_AGREED } = STATUS

      const reminders = await getRemindersToSend(
        threeMonths,
        '2025-08-05T00:00:00.000Z',
        '2024-05-05T00:00:00.000Z',
        [sixMonths, nineMonths],
        fakeMaxBatchSize,
        dbMock,
        mockLogger
      )

      expect(dbMock.collection().aggregate().sort().project().limit).toHaveBeenCalledTimes(1)
      expect(dbMock.collection).toHaveBeenCalledWith('applications')
      expect(dbMock.collection().aggregate).toHaveBeenCalledWith([
        {
          $lookup: {
            from: 'claims',
            localField: 'reference',
            foreignField: 'applicationReference',
            as: 'claimMatches'
          }
        },
        {
          $match: {
            type: 'EE',
            statusId: { $ne: NOT_AGREED },
            createdAt: {
              $gte: '2024-05-05T00:00:00.000Z',
              $lte: '2025-08-05T00:00:00.000Z'
            },
            // TODO replace this is condition that checks application history
            // reminders: {
            //   $nin: [threeMonths, sixMonths, nineMonths]
            // },
            claimMatches: { $size: 0 }
          }
        }
      ])
      expect(dbMock.collection().aggregate().sort).toHaveBeenCalledWith({
        createdAt: 1
      })
      expect(dbMock.collection().aggregate().sort().project).toHaveBeenCalledWith({
        reference: 1,
        crn: { $eq: ['$organisation.crn'] },
        sbi: { $eq: ['$organisation.sbi'] },
        email: { $eq: ['$organisation.email'] },
        orgEmail: { $eq: ['$organisation.orgEmail'] },
        // TODO replace this is condition that checks application history
        // reminders: 1,
        reminderType: { $literal: threeMonths },
        createdAt: 1
      })
      expect(dbMock.collection().aggregate().sort().project().limit).toHaveBeenCalledWith(5000)
      expect(mockLogger.info).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Getting reminders due, reminder type 'notClaimed_threeMonths', window start '2025-08-05T00:00:00.000Z', end '2024-05-05T00:00:00.000Z' and haven't already received later reminders 'notClaimed_sixMonths,notClaimed_nineMonths'"
      )
      expect(reminders).toHaveLength(1)
    })
  })

  describe('updateReminders', () => {
    const mockLogger = {
      info: jest.fn()
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('updates reminders on application', async () => {
      await updateReminders(
        'IAHW-5BA2-6DFD',
        'notClaimed_nineMonths',
        undefined,
        dbMock,
        mockLogger
      )

      expect(dbMock.collection().updateOne).toHaveBeenCalledTimes(1)
      expect(dbMock.collection().updateOne).toHaveBeenCalledWith(
        { reference: 'IAHW-5BA2-6DFD' },
        // TODO replace this is condition that checks application history
        // { $set: { reminders: 'notClaimed_nineMonths' } }
        {}
      )
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
        'Successfully updated reminders, rows affected: 1'
      )
    })
  })

  describe('updateApplication', () => {
    it('should call findOneAndUpdate with correct parameters and return result', async () => {
      const updatedApplication = {
        reference: 'IAHW-8ZPZ-8CLI',
        status: 'WITHDRAWN',
        updatedBy: 'test-user',
        updatedAt: new Date('2025-10-22T16:21:46.091Z')
      }
      collectionMock.findOneAndUpdate.mockResolvedValue(updatedApplication)

      const result = await updateApplication({
        db: dbMock,
        reference: 'IAHW-8ZPZ-8CLI',
        updatedPropertyPath: 'status',
        newValue: 'WITHDRAWN',
        oldValue: 'AGREED',
        note: 'updating status',
        user: 'test-user',
        updatedAt: new Date('2025-10-22T16:21:46.091Z')
      })

      expect(dbMock.collection).toHaveBeenCalledWith('applications')
      expect(collectionMock.findOneAndUpdate).toHaveBeenCalledWith(
        { reference: 'IAHW-8ZPZ-8CLI' },
        {
          $set: {
            status: 'WITHDRAWN',
            updatedBy: 'test-user',
            updatedAt: new Date('2025-10-22T16:21:46.091Z')
          },
          $push: {
            updateHistory: {
              id: expect.any(String),
              note: 'updating status',
              newValue: 'WITHDRAWN',
              oldValue: 'AGREED',
              createdAt: new Date('2025-10-22T16:21:46.091Z'),
              createdBy: 'test-user',
              eventType: 'application-status',
              updatedProperty: 'status'
            }
          }
        },
        { returnDocument: 'after' }
      )
      expect(result).toBe(updatedApplication)
    })
  })

  describe('searchApplications', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    test.each([
      { search: { text: '444444444', type: 'sbi' }, expectedMatch: 'organisation.sbi' },
      { search: { text: 'AHWR-555A-FD6E', type: 'ref' }, expectedMatch: 'reference' },
      {
        search: { text: 'AHWR-555A-FD6E', type: 'ref' },
        expectedMatch: 'reference',
        filter: ['on hold', 'in check']
      }
    ])(
      'Calls through to search database with expected query for simple criteria',
      async ({ search, expectedMatch, filter }) => {
        const foundApplications = [
          {
            reference: 'IAHW-8ZPZ-8CLI'
          }
        ]
        collectionMock.toArray.mockResolvedValueOnce([
          {
            total: 1
          }
        ])
        collectionMock.toArray.mockResolvedValueOnce(foundApplications)
        const res = await searchApplications(dbMock, search.text, search.type, filter ?? [])

        const expectedFilter = filter ? { status: { $in: filter } } : undefined
        const expectedMatchExpression = { $match: { [`${expectedMatch}`]: search.text } }
        if (expectedFilter) {
          expectedMatchExpression.$match.status = { $in: filter }
        }

        expect(res).toEqual({
          applications: foundApplications,
          total: 1
        })
        expect(dbMock.collection).toHaveBeenCalledWith('applications')
        expect(collectionMock.aggregate).toHaveBeenCalledWith([
          expectedMatchExpression,
          {
            $unionWith: {
              coll: 'owapplications',
              pipeline: [expectedMatchExpression]
            }
          },
          { $count: 'total' }
        ])
        expect(collectionMock.aggregate).toHaveBeenCalledWith([
          expectedMatchExpression,
          {
            $addFields: {
              type: 'EE'
            }
          },
          {
            $unionWith: {
              coll: 'owapplications',
              pipeline: [
                expectedMatchExpression,
                {
                  $addFields: {
                    type: 'VV'
                  }
                }
              ]
            }
          },
          { $sort: { createdAt: -1 } },
          { $skip: 0 },
          { $limit: 10 },
          {
            $addFields: {
              flags: {
                $filter: flagNotDeletedFilter
              }
            }
          }
        ])
      }
    )

    test.each([
      { search: { text: 'applied', type: 'status' }, expectedMatch: 'APPLIED' },
      { search: { text: 'claimed', type: 'status' }, expectedMatch: 'CLAIMED' },
      { search: { text: 'in check', type: 'status' }, expectedMatch: 'IN_CHECK' },
      { search: { text: 'accepted', type: 'status' }, expectedMatch: 'ACCEPTED' },
      { search: { text: 'rejected', type: 'status' }, expectedMatch: 'REJECTED' },
      { search: { text: 'paid', type: 'status' }, expectedMatch: 'PAID' },
      { search: { text: 'withdrawn', type: 'status' }, expectedMatch: 'WITHDRAWN' },
      { search: { text: 'on hold', type: 'status' }, expectedMatch: 'ON_HOLD' },
      { search: { text: 'ready to pay', type: 'status' }, expectedMatch: 'READY_TO_PAY' }
    ])('returns success when searching for statuses', async ({ search, expectedMatch, filter }) => {
      const foundApplications = [
        {
          reference: 'IAHW-8ZPZ-8CLI'
        }
      ]
      collectionMock.toArray.mockResolvedValueOnce([
        {
          total: 1
        }
      ])
      collectionMock.toArray.mockResolvedValueOnce(foundApplications)
      const res = await searchApplications(dbMock, search.text, search.type, [])

      expect(res).toEqual({
        applications: foundApplications,
        total: 1
      })
      expect(dbMock.collection).toHaveBeenCalledWith('applications')
      expect(collectionMock.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            status: {
              $regex: expectedMatch,
              $options: 'i'
            }
          }
        },
        {
          $unionWith: {
            coll: 'owapplications',
            pipeline: [
              {
                $match: {
                  status: {
                    $regex: expectedMatch,
                    $options: 'i'
                  }
                }
              }
            ]
          }
        },
        { $count: 'total' }
      ])
      expect(collectionMock.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            status: {
              $regex: expectedMatch,
              $options: 'i'
            }
          }
        },
        {
          $addFields: {
            type: 'EE'
          }
        },
        {
          $unionWith: {
            coll: 'owapplications',
            pipeline: [
              {
                $match: {
                  status: {
                    $regex: expectedMatch,
                    $options: 'i'
                  }
                }
              },
              {
                $addFields: {
                  type: 'VV'
                }
              }
            ]
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: 0 },
        { $limit: 10 },
        {
          $addFields: {
            flags: {
              $filter: flagNotDeletedFilter
            }
          }
        }
      ])
    })

    test.each([
      {
        search: { text: '19/12/2025', type: 'date' },
        expectedStart: new Date(2025, 11, 19),
        expectedEnd: new Date(2025, 11, 20)
      },
      {
        search: { text: '31/03/2025', type: 'date' },
        expectedStart: new Date(2025, 2, 31),
        expectedEnd: new Date(2025, 3, 1)
      }
    ])(
      'returns success when searching for date',
      async ({ search, expectedStart, expectedEnd }) => {
        const foundApplications = [
          {
            reference: 'IAHW-8ZPZ-8CLI'
          }
        ]
        collectionMock.toArray.mockResolvedValueOnce([
          {
            total: 1
          }
        ])
        collectionMock.toArray.mockResolvedValueOnce(foundApplications)
        const res = await searchApplications(dbMock, search.text, search.type, [])

        expect(res).toEqual({
          applications: foundApplications,
          total: 1
        })
        expect(dbMock.collection).toHaveBeenCalledWith('applications')
        expect(collectionMock.aggregate).toHaveBeenCalledWith([
          {
            $match: {
              createdAt: { $gte: expectedStart, $lt: expectedEnd }
            }
          },
          {
            $unionWith: {
              coll: 'owapplications',
              pipeline: [
                {
                  $match: {
                    createdAt: { $gte: expectedStart, $lt: expectedEnd }
                  }
                }
              ]
            }
          },
          { $count: 'total' }
        ])
        expect(collectionMock.aggregate).toHaveBeenCalledWith([
          {
            $match: {
              createdAt: { $gte: expectedStart, $lt: expectedEnd }
            }
          },
          {
            $addFields: {
              type: 'EE'
            }
          },
          {
            $unionWith: {
              coll: 'owapplications',
              pipeline: [
                {
                  $match: {
                    createdAt: { $gte: expectedStart, $lt: expectedEnd }
                  }
                },
                {
                  $addFields: {
                    type: 'VV'
                  }
                }
              ]
            }
          },
          { $sort: { createdAt: -1 } },
          { $skip: 0 },
          { $limit: 10 },
          {
            $addFields: {
              flags: {
                $filter: flagNotDeletedFilter
              }
            }
          }
        ])
      }
    )

    test.each([
      { search: { text: 'terrys', type: 'organisation' } },
      { search: { text: 'chocolate', type: 'organisation' } }
    ])('returns success when searching for organisation', async ({ search }) => {
      const foundApplications = [
        {
          reference: 'IAHW-8ZPZ-8CLI'
        }
      ]
      collectionMock.toArray.mockResolvedValueOnce([
        {
          total: 1
        }
      ])
      collectionMock.toArray.mockResolvedValueOnce(foundApplications)
      const res = await searchApplications(dbMock, search.text, search.type, [])

      expect(res).toEqual({
        applications: foundApplications,
        total: 1
      })
      expect(dbMock.collection).toHaveBeenCalledWith('applications')
      expect(collectionMock.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            'organisation.name': { $regex: search.text, $options: 'i' }
          }
        },
        {
          $unionWith: {
            coll: 'owapplications',
            pipeline: [
              {
                $match: {
                  'organisation.name': { $regex: search.text, $options: 'i' }
                }
              }
            ]
          }
        },
        { $count: 'total' }
      ])
      expect(collectionMock.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            'organisation.name': { $regex: search.text, $options: 'i' }
          }
        },
        {
          $addFields: {
            type: 'EE'
          }
        },
        {
          $unionWith: {
            coll: 'owapplications',
            pipeline: [
              {
                $match: {
                  'organisation.name': { $regex: search.text, $options: 'i' }
                }
              },
              {
                $addFields: {
                  type: 'VV'
                }
              }
            ]
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: 0 },
        { $limit: 10 },
        {
          $addFields: {
            flags: {
              $filter: flagNotDeletedFilter
            }
          }
        }
      ])
    })

    test('returns successful result when no data found', async () => {
      collectionMock.toArray.mockResolvedValueOnce([
        {
          total: 0
        }
      ])

      const res = await searchApplications(dbMock, 'aaaaa', 'ref', [])

      expect(res).toEqual({
        applications: [],
        total: 0
      })

      expect(collectionMock.aggregate).toHaveBeenCalledTimes(1)
    })
  })
})

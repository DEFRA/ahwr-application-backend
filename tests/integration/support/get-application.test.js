import { setupTestEnvironment, teardownTestEnvironment } from '../test-utils.js'
import { application } from '../../data/application-data.js'
import { owApplicationReviewClaim } from '../../data/ow-application-data.js'

describe('Get applications', () => {
  let server

  beforeAll(async () => {
    server = await setupTestEnvironment()
  })

  beforeEach(async () => {
    await server.db.collection('applications').deleteMany({})
    await server.db.collection('applications').insertOne(application)
    await server.db.collection('owapplications').deleteMany({})
    await server.db.collection('owapplications').insertOne(owApplicationReviewClaim)
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  test('successfully retrieves application', async () => {
    const options = {
      method: 'GET',
      url: '/api/support/applications/IAHW-G3CL-V59P'
    }
    const res = await server.inject({
      ...options
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({
      _id: expect.any(String),
      status: 'AGREED',
      reference: 'IAHW-G3CL-V59P',
      data: {
        reference: 'TEMP-AAAA-AAAA',
        declaration: true,
        offerStatus: 'accepted',
        confirmCheckDetails: 'yes'
      },
      organisation: {
        name: 'Fake org name',
        farmerName: 'Fake farmer name',
        email: 'fake.farmer.email@example.com.test',
        sbi: '123456789',
        address: '1 fake street,fake town,United Kingdom',
        orgEmail: 'fake.org.email@example.com.test'
      },
      createdAt: expect.any(String),
      statusHistory: [
        {
          status: 'AGREED',
          createdBy: 'admin',
          createdAt: '2025-04-02T08:46:19.637Z'
        }
      ],
      updateHistory: [],
      contactHistory: [],
      flags: [
        {
          id: '0b401d15-b594-4bce-851a-0f676f1ce5a6',
          note: "User did not agree with multi herds T&C's",
          deleted: true,
          createdAt: '2025-04-30T10:42:04.707Z',
          createdBy: 'Rob Catton (EqualExperts)',
          deletedAt: '2025-04-30T10:50:55.169Z',
          deletedBy: 'Rob Catton (EqualExperts)',
          appliesToMh: true,
          deletedNote: "User has changed their mind and accepted the T&C's"
        },
        {
          id: '98b575f0-82cf-46ca-9034-1002b2bf6bec',
          note: 'This user lies a lot on their claims.',
          deleted: true,
          createdAt: '2025-04-30T10:43:01.066Z',
          createdBy: 'Rob Catton (EqualExperts)',
          deletedAt: '2025-06-23T07:42:12.104Z',
          deletedBy: 'Carroll, Aaron',
          appliesToMh: false,
          deletedNote: 'no they do not'
        }
      ],
      eligiblePiiRedaction: true
    })
  })

  test('successfully retrieves OW application', async () => {
    const options = {
      method: 'GET',
      url: '/api/support/applications/AHWR-B571-6E79'
    }
    const res = await server.inject({
      ...options
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({
      _id: expect.any(String),
      claimed: false,
      contactHistory: [
        {
          createdAt: '2024-11-20T13:51:24.291Z',
          field: 'email',
          id: '7e4dca92-2ee8-4420-8efc-eec7daafd26b',
          newValue: 'karengilberta@trebligneraky.com.test',
          oldValue: 'notreal@madeitup.com'
        },
        {
          createdAt: '2024-11-20T13:51:24.291Z',
          field: 'orgEmail',
          id: '95598de8-c0fa-4ba2-bb8f-17bc746e305d',
          newValue: 'burdassfrz@rfssadrubj.com.test',
          oldValue: 'notreal@madeitup.com'
        },
        {
          createdAt: '2024-11-20T13:51:24.291Z',
          field: 'address',
          id: '45a78b8f-3f88-424f-97cc-b223145098ae',
          newValue:
            'Forest View Farm,PAYHEMBURY,CLAYTONS FARM,LITTLE LONDON,NEWBURY,GL3 4RA,United Kingdom',
          oldValue: 'A road, a town,United Kingdom'
        },
        {
          createdAt: '2024-11-20T13:51:24.291Z',
          field: 'farmerName',
          id: 'c3098368-247c-4b5d-92d1-d9362021a72a',
          newValue: 'Karen Gilbert',
          oldValue: 'Tim Madeup'
        }
      ],
      createdAt: '2023-09-21T21:11:02.776Z',
      createdBy: 'admin',
      data: {
        confirmCheckDetails: 'yes',
        dateOfClaim: '2023-11-23T20:17:43.694Z',
        dateOfTesting: '2023-11-10T00:00:00.000Z',
        declaration: true,
        detailsCorrect: 'yes',
        eligibleSpecies: 'yes',
        offerStatus: 'accepted',
        urnResult: '355981',
        vetName: 'Mr CowWhisperer',
        vetRcvs: '1208642',
        visitDate: '2023-11-10T00:00:00.000Z',
        whichReview: 'beef'
      },
      eligiblePiiRedaction: true,
      flags: [],
      organisation: {
        address:
          'Forest View Farm,PAYHEMBURY,CLAYTONS FARM,LITTLE LONDON,NEWBURY,GL3 4RA,United Kingdom',
        email: 'karengilberta@trebligneraky.com.test',
        farmerName: 'Karen Gilbert',
        name: 'Mr madeup',
        orgEmail: 'burdassfrz@rfssadrubj.com.test',
        sbi: '123456789'
      },
      redactionHistory: {},
      reference: 'AHWR-B571-6E79',
      status: 'READY_TO_PAY',
      statusHistory: [],
      updateHistory: [],
      updatedAt: '2024-11-20T13:51:24.283Z',
      updatedBy: 'admin'
    })
  })
})

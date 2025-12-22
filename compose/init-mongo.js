/* global db */

// Switch to (or create) a database, e.g. "testdb"
/* eslint-disable-next-line no-global-assign */
db = db.getSiblingDB('ahwr-application-backend')

db.createCollection('applications')
db.getCollection('applications').insertMany([
  {
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
    createdAt: new Date(),
    statusHistory: [
      {
        status: 'AGREED',
        createdBy: 'admin',
        createdAt: new Date('2025-04-02T08:46:19.637Z')
      }
    ],
    updateHistory: [],
    contactHistory: [],
    flags: [
      {
        id: '0b401d15-b594-4bce-851a-0f676f1ce5a6',
        note: "User did not agree with multi herds T&C's",
        deleted: true,
        createdAt: new Date('2025-04-30T10:42:04.707Z'),
        createdBy: 'Rob Catton (EqualExperts)',
        deletedAt: new Date('2025-04-30T10:50:55.169Z'),
        deletedBy: 'Rob Catton (EqualExperts)',
        appliesToMh: true,
        deletedNote: "User has changed their mind and accepted the T&C's"
      },
      {
        id: '98b575f0-82cf-46ca-9034-1002b2bf6bec',
        note: 'This user lies a lot on their claims.',
        deleted: true,
        createdAt: new Date('2025-04-30T10:43:01.066Z'),
        createdBy: 'Rob Catton (EqualExperts)',
        deletedAt: new Date('2025-06-23T07:42:12.104Z'),
        deletedBy: 'Carroll, Aaron',
        appliesToMh: false,
        deletedNote: 'no they do not'
      }
    ],
    eligiblePiiRedaction: true
  }
])

db.createCollection('claims')
db.getCollection('claims').insertMany([
  {
    reference: 'FUBC-JTTU-SDQ7',
    applicationReference: 'IAHW-G3CL-V59P',
    createdAt: new Date('2025-08-15T09:00:53.000Z'),
    updatedAt: new Date('2025-08-15T09:00:53.000Z'),
    createdBy: 'admin',
    updatedBy: null,
    type: 'FOLLOW_UP',
    data: {
      amount: 837,
      piHunt: 'yes',
      vetsName: 'frrrr',
      claimType: 'E',
      biosecurity: 'yes',
      dateOfVisit: new Date('2025-08-15T00:00:00.000Z'),
      testResults: 'negative',
      dateOfTesting: new Date('2025-08-15T00:00:00.000Z'),
      laboratoryURN: 'URN34567ddd',
      vetRCVSNumber: '1234567',
      speciesNumbers: 'yes',
      typeOfLivestock: 'beef',
      piHuntAllAnimals: 'yes',
      piHuntRecommended: 'yes',
      reviewTestResults: 'negative'
    },
    status: 'IN_CHECK',
    statusHistory: [
      {
        status: 'IN_CHECK',
        createdBy: 'admin',
        createdAt: new Date('2025-08-15T09:00:53.000Z')
      }
    ],
    herd: {
      id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
      cph: '12/345/6789',
      name: 'EventTester',
      reasons: ['uniqueHealthNeeds'],
      version: 2,
      associatedAt: new Date('2025-08-15T09:00:53.420Z')
    },
    updateHistory: []
  },
  {
    reference: 'REBC-VA4R-TRL7',
    applicationReference: 'IAHW-G3CL-V59P',
    createdAt: new Date('2025-04-24 08:24:24.092000 +00:00'),
    updatedAt: new Date('2025-04-28 07:44:03.864000 +00:00'),
    createdBy: 'admin',
    updatedBy: null,
    type: 'REVIEW',
    data: {
      amount: 522,
      vetsName: 'Mr C test',
      claimType: 'R',
      dateOfVisit: new Date('2025-04-25T00:00:00.000Z'),
      testResults: 'negative',
      dateOfTesting: new Date('2025-04-24T00:00:00.000Z'),
      laboratoryURN: 'w5436346ret',
      vetRCVSNumber: '1111111',
      speciesNumbers: 'yes',
      typeOfLivestock: 'beef',
      numberAnimalsTested: '10'
    },
    status: 'IN_CHECK',
    statusHistory: [
      {
        status: 'IN_CHECK',
        createdBy: 'admin',
        createdAt: new Date('2025-04-28T07:44:03.864Z')
      }
    ],
    herd: {},
    updateHistory: [
      {
        id: 'e3d320b7-b2cf-469a-903f-ead7587d98e9',
        note: 'Updated to check event',
        newValue: 'Mr C test',
        oldValue: 'Mr B Test',
        createdAt: new Date('2025-04-25T13:05:39.937+00:00'),
        createdBy: 'Carroll, Aaron',
        eventType: 'claim-vetsName',
        updatedProperty: 'vetsName'
      },
      {
        id: '2e468208-1f07-46c3-a032-885d5868bd3d',
        note: 'Updated date',
        newValue: new Date('2025-04-25T00:00:00.000Z'),
        oldValue: new Date('2025-04-24T00:00:00.000Z'),
        createdAt: new Date('2025-04-25T13:35:43.53+00:00'),
        createdBy: 'Carroll, Aaron',
        eventType: 'claim-dateOfVisit',
        updatedProperty: 'dateOfVisit'
      },
      {
        id: '0dd471c3-3d22-4093-83d2-ab549bd65a59',
        note: 'updated for checking',
        newValue: '1111111',
        oldValue: '5312363',
        createdAt: new Date('2025-04-28T07:44:06.944+00:00'),
        createdBy: 'Carroll, Aaron',
        eventType: 'claim-vetRCVSNumber',
        updatedProperty: 'vetRCVSNumber'
      }
    ]
  }
])

db.createCollection('herds')
db.getCollection('herds').insertMany([
  {
    id: '40ba22b3-cfdc-4d8c-b491-13873ec97439',
    cph: 'REDACTED_CPH',
    name: 'REDACTED_HERD_NAME',
    reasons: ['onlyHerd'],
    species: 'sheep',
    version: 1,
    createdAt: new Date('2025-07-14T13:17:55.380989+00:00'),
    createdBy: 'admin',
    isCurrent: true,
    updatedAt: new Date('2025-08-14T08:16:44.521+00:00'),
    updatedBy: 'admin',
    applicationReference: 'IAHW-G3CL-V59P'
  },
  {
    id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
    cph: '12/345/6789',
    name: 'EventTester',
    reasons: ['uniqueHealthNeeds'],
    species: 'beef',
    version: 2,
    createdAt: new Date('2025-08-15T09:00:53.414883+00:00'),
    createdBy: 'admin',
    isCurrent: true,
    applicationReference: 'IAHW-G7B4-UTZ5'
  },
  {
    id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
    cph: '12/345/6789',
    name: 'EventTester',
    reasons: ['separateManagementNeeds'],
    species: 'beef',
    version: 1,
    createdAt: new Date('2025-08-15T08:54:04.271367+00:00'),
    createdBy: 'admin',
    isCurrent: false,
    applicationReference: 'IAHW-G7B4-UTZ5'
  }
])

db.createCollection('owapplications')
db.getCollection('owapplications').insertMany([
  {
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
    statusHistory: [
      {
        status: 'IN_CHECK',
        createdBy: 'admin',
        createdAt: new Date('2023-09-21T21:11:02.776Z')
      },
      {
        status: 'RECOMMENDED_TO_PAY',
        createdBy: 'admin',
        createdAt: new Date('2023-09-22T21:11:02.776Z')
      },
      {
        status: 'READY_TO_PAY',
        createdBy: 'admin',
        createdAt: new Date('2023-09-23T21:11:02.776Z')
      }
    ],
    updateHistory: [],
    contactHistory: [
      {
        id: '7e4dca92-2ee8-4420-8efc-eec7daafd26b',
        field: 'email',
        newValue: 'karengilberta@trebligneraky.com.test',
        oldValue: 'notreal@madeitup.com',
        createdAt: new Date('2024-11-20T13:51:24.291Z')
      },
      {
        id: '95598de8-c0fa-4ba2-bb8f-17bc746e305d',
        field: 'orgEmail',
        newValue: 'burdassfrz@rfssadrubj.com.test',
        oldValue: 'notreal@madeitup.com',
        createdAt: new Date('2024-11-20T13:51:24.291Z')
      },
      {
        id: '45a78b8f-3f88-424f-97cc-b223145098ae',
        field: 'address',
        newValue:
          'Forest View Farm,PAYHEMBURY,CLAYTONS FARM,LITTLE LONDON,NEWBURY,GL3 4RA,United Kingdom',
        oldValue: 'A road, a town,United Kingdom',
        createdAt: new Date('2024-11-20T13:51:24.291Z')
      },
      {
        id: 'c3098368-247c-4b5d-92d1-d9362021a72a',
        field: 'farmerName',
        newValue: 'Karen Gilbert',
        oldValue: 'Tim Madeup',
        createdAt: new Date('2024-11-20T13:51:24.291Z')
      }
    ],
    redactionHistory: {},
    flags: [],
    claimed: false,
    eligiblePiiRedaction: true
  },
  {
    reference: 'AHWR-B571-6E80',
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
    status: 'RECOMMENDED_TO_PAY',
    statusHistory: [
      {
        status: 'IN_CHECK',
        createdBy: 'admin',
        createdAt: new Date('2023-09-21T21:11:02.776Z')
      },
      {
        status: 'RECOMMENDED_TO_PAY',
        createdBy: 'admin',
        createdAt: new Date('2023-09-22T21:11:02.776Z')
      }
    ],
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
  },
  {
    reference: 'AHWR-B571-6E85',
    createdAt: new Date('2018-08-12T10:00:00.000Z'),
    updatedAt: new Date('2025-08-13T14:40:14.591Z'),
    createdBy: 'admin',
    updatedBy: 'admin',
    data: {
      vetName: 'REDACTED_VETS_NAME',
      vetRcvs: 'REDACTED_VET_RCVS_NUMBER',
      urnResult: 'REDACTED_LABORATORY_URN',
      visitDate: new Date('2024-10-10T00:00:00.000Z'),
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
      sbi: '107151179',
      name: 'REDACTED_NAME',
      email: 'redacted.email@example.com',
      address: 'REDACTED_ADDRESS',
      orgEmail: 'redacted.org.email@example.com',
      farmerName: 'REDACTED_FARMER_NAME'
    },
    status: 'READY_TO_PAY',
    statusHistory: [],
    updateHistory: [
      {
        id: 'ae0427b5-6a07-4e77-9ded-7d3be06ff802',
        note: 'REDACTED_NOTE',
        newValue: 'REDACTED_VETS_NAME',
        oldValue: 'REDACTED_VETS_NAME',
        createdAt: new Date('2025-04-25T13:10:47.023Z'),
        createdBy: 'Carroll, Aaron',
        eventType: 'application-vetName',
        updatedProperty: 'vetName'
      }
    ],
    contactHistory: [
      {
        id: '98e06007-6f6b-42a2-929c-13a43094c049',
        field: 'orgEmail',
        newValue: 'REDACTED_MULTI_TYPE_VALUE',
        oldValue: 'REDACTED_MULTI_TYPE_VALUE',
        createdAt: new Date('2024-11-20T13:54:35.612Z')
      },
      {
        id: 'aa4da0b8-e826-47e6-99a7-61239ac41389',
        field: 'email',
        newValue: 'REDACTED_MULTI_TYPE_VALUE',
        oldValue: 'REDACTED_MULTI_TYPE_VALUE',
        createdAt: new Date('2024-11-20T13:54:35.612Z')
      },
      {
        id: 'c8c9d1b8-8449-48a4-b404-8bd5e915cda5',
        field: 'address',
        newValue: 'REDACTED_MULTI_TYPE_VALUE',
        oldValue: 'REDACTED_MULTI_TYPE_VALUE',
        createdAt: new Date('2024-11-20T13:54:35.612Z')
      },
      {
        id: '246dc2a1-fb95-443f-8572-0c82abdc6a57',
        field: 'farmerName',
        newValue: 'REDACTED_MULTI_TYPE_VALUE',
        oldValue: 'REDACTED_MULTI_TYPE_VALUE',
        createdAt: new Date('2024-11-20T13:54:35.613Z')
      }
    ],
    redactionHistory: {},
    flags: [
      {
        id: '46ca52ea-5f06-4a9f-913c-bd645436b8aa',
        note: 'Application PII redacted',
        deleted: false,
        createdAt: new Date('2025-08-13T14:40:14.778Z'),
        createdBy: 'admin',
        appliesToMh: false
      },
      {
        id: '846f63f0-5e7d-4139-91d3-1137b91e5835',
        note: 'Application PII redacted',
        deleted: false,
        createdAt: new Date('2025-08-13T14:40:14.695Z'),
        createdBy: 'admin',
        appliesToMh: false
      },
      {
        id: 'bf7e9511-3b7e-4ace-9426-1b417b5ecea5',
        note: 'REDACTED_NOTE',
        deleted: true,
        createdAt: new Date('2025-08-13T14:30:31.623Z'),
        createdBy: 'admin',
        deletedAt: new Date('2025-08-13T14:40:14.611Z'),
        deletedBy: 'admin',
        appliesToMh: false,
        deletedNote:
          "Deleted to allow 'Redact PII' flag to be added, only one flag with appliesToMh=false allowed."
      }
    ],
    claimed: false,
    eligiblePiiRedaction: true
  }
])

const fs = require('fs')
const raw = fs.readFileSync('/temp/DevNewWorldApplications.json')
const rawOld = fs.readFileSync('/temp/DevOldWorldApplications.json')
const rawClaims = fs.readFileSync('/temp/DevClaims.json')
let docs = JSON.parse(raw)
db.applications.insertMany(docs)
docs = JSON.parse(rawOld)
db.owapplications.insertMany(docs)
docs = JSON.parse(rawClaims)
db.claims.insertMany(docs)

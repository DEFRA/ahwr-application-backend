/* global db */

// Switch to (or create) a database, e.g. "testdb"
/* eslint-disable-next-line no-global-assign */
db = db.getSiblingDB('ahwr-application-backend')

db.createCollection('applications')
db.getCollection('applications').insertMany([
  {
    status: 'AGREED',
    data: {
      reference: 'IAHW-AAAA-AAAA',
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
    createdAt: new Date()
  }
])

db.createCollection('claims')
db.getCollection('claims').insertMany([
  {
    reference: 'FUBC-JTTU-SDQ7',
    applicationReference: 'IAHW-G7B4-UTZ5',
    createdAt: '2025-08-15 09:00:53.422000 +00:00',
    updatedAt: '2025-08-15 09:00:53.422000 +00:00',
    createdBy: 'admin',
    updatedBy: null,
    type: 'FOLLOW-UP',
    data: {
      amount: 837,
      piHunt: 'yes',
      vetsName: 'frrrr',
      claimType: 'E',
      biosecurity: 'yes',
      dateOfVisit: '2025-08-15T00:00:00.000Z',
      testResults: 'negative',
      dateOfTesting: '2025-08-15T00:00:00.000Z',
      laboratoryURN: 'URN34567ddd',
      vetRCVSNumber: '1234567',
      speciesNumbers: 'yes',
      typeOfLivestock: 'beef',
      piHuntAllAnimals: 'yes',
      piHuntRecommended: 'yes',
      reviewTestResults: 'negative'
    },
    status: 'IN CHECK',
    statusHistory: [],
    herd: {
      id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
      cph: '12/345/6789',
      name: 'EventTester',
      reasons: ['uniqueHealthNeeds'],
      version: 2,
      associatedAt: '2025-08-15T09:00:53.420Z'
    },
    updateHistory: []
  },
  {
    reference: 'REBC-VA4R-TRL7',
    applicationReference: 'IAHW-7NF8-3KB9',
    createdAt: '2025-04-24 08:24:24.092000 +00:00',
    updatedAt: '2025-04-28 07:44:03.864000 +00:00',
    createdBy: 'admin',
    updatedBy: null,
    type: 'REVIEW',
    data: {
      amount: 522,
      vetsName: 'Mr C test',
      claimType: 'R',
      dateOfVisit: '2025-04-25T00:00:00.000Z',
      testResults: 'negative',
      dateOfTesting: '2025-04-24T00:00:00.000Z',
      laboratoryURN: 'w5436346ret',
      vetRCVSNumber: '1111111',
      speciesNumbers: 'yes',
      typeOfLivestock: 'beef',
      numberAnimalsTested: '10'
    },
    status: 'IN CHECK',
    statusHistory: [],
    herd: {},
    updateHistory: [
      {
        id: 'e3d320b7-b2cf-469a-903f-ead7587d98e9',
        note: 'Updated to check event',
        newValue: 'Mr C test',
        oldValue: 'Mr B Test',
        createdAt: '2025-04-25T13:05:39.937+00:00',
        createdBy: 'Carroll, Aaron',
        eventType: 'claim-vetsName',
        updatedProperty: 'vetsName'
      },
      {
        id: '2e468208-1f07-46c3-a032-885d5868bd3d',
        note: 'Updated date',
        newValue: '2025-04-25T00:00:00.000Z',
        oldValue: '2025-04-24T00:00:00.000Z',
        createdAt: '2025-04-25T13:35:43.53+00:00',
        createdBy: 'Carroll, Aaron',
        eventType: 'claim-dateOfVisit',
        updatedProperty: 'dateOfVisit'
      },
      {
        id: '0dd471c3-3d22-4093-83d2-ab549bd65a59',
        note: 'updated for checking',
        newValue: '1111111',
        oldValue: '5312363',
        createdAt: '2025-04-28T07:44:06.944+00:00',
        createdBy: 'Carroll, Aaron',
        eventType: 'claim-vetRCVSNumber',
        updatedProperty: 'vetRCVSNumber'
      }
    ]
  }
])

db.createCollection('status_history')
db.getCollection('status_history').insertMany([
  {
    id: '9c2a7b8b-139c-46e8-b9e1-92d25a59e201',
    reference: 'IAHW-AAAA-AAAA',
    statusId: '1',
    note: '',
    createdAt: new Date(),
    createdBy: 'admin'
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
    createdAt: '2025-07-14T13:17:55.380989+00:00',
    createdBy: 'admin',
    isCurrent: true,
    updatedAt: '2025-08-14T08:16:44.521+00:00',
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
    createdAt: '2025-08-15T09:00:53.414883+00:00',
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
    createdAt: '2025-08-15T08:54:04.271367+00:00',
    createdBy: 'admin',
    isCurrent: false,
    applicationReference: 'IAHW-G7B4-UTZ5'
  }
])

/* global db */

// Switch to (or create) a database, e.g. "testdb"
/* eslint-disable-next-line no-global-assign */
db = db.getSiblingDB('ahwr-application-backend')

db.createCollection('application')
db.getCollection('application').insertMany([
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

db.createCollection('claim')
db.getCollection('claim').insertMany([
  {
    reference: 'REBC-AAAA-AAAA',
    applicationReference: 'IAHW-AAAA-AAAA',
    statusId: 2,
    createdAt: new Date(),
    data: {
      typeOfLivestock: 'beef',
      dateOfVisit: new Date(),
      dateOfTesting: new Date(),
      isReview: true,
      herdName: 'beef',
      herdCph: '00/000/0000',
      isOnlyHerd: 'Yes',
      herdReasons: ['onlyHerd'],
      speciesNumbers: 'yes',
      vetsName: 'Fake Vet',
      vetRCVSNumber: '0000000',
      laboratoryURN: '000000',
      testResults: 'positive'
    }
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

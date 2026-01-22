const person1 = 'Rob Catton (EqualExperts)'
const person2 = 'Carroll, Aaron'

export const applicationDocument = ({ reference }) => ({
  status: 'AGREED',
  reference,
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
      createdBy: person1,
      deletedAt: new Date('2025-04-30T10:50:55.169Z'),
      deletedBy: person1,
      appliesToMh: true,
      deletedNote: "User has changed their mind and accepted the T&C's"
    },
    {
      id: '98b575f0-82cf-46ca-9034-1002b2bf6bec',
      note: 'This user lies a lot on their claims.',
      deleted: true,
      createdAt: new Date('2025-04-30T10:43:01.066Z'),
      createdBy: person1,
      deletedAt: new Date('2025-06-23T07:42:12.104Z'),
      deletedBy: person2,
      appliesToMh: false,
      deletedNote: 'no they do not'
    }
  ],
  eligiblePiiRedaction: true
})

export const herdDocumentVersion1 = {
  id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
  cph: '12/345/6789',
  name: 'EventTester',
  reasons: ['separateManagementNeeds'],
  species: 'beef',
  version: 1,
  createdAt: new Date('2025-08-15T08:54:04.271367+00:00'),
  createdBy: 'admin',
  isCurrent: false,
  applicationReference: 'IAHW-G3CL-V59P'
}

export const herdDocumentVersion2 = {
  id: '0e4f55ea-ed42-4139-9c46-c75ba63b0742',
  cph: '12/345/6789',
  name: 'EventTester',
  reasons: ['separateManagementNeeds'],
  species: 'beef',
  version: 2,
  createdAt: new Date('2025-08-15T08:54:04.271367+00:00'),
  createdBy: 'admin',
  isCurrent: true,
  applicationReference: 'IAHW-G3CL-V59P'
}

export const multipleVersionsHerdDocument = [herdDocumentVersion1, herdDocumentVersion2]

export const claimDocument = {
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
  statusHistory: [],
  herd: {},
  updateHistory: [
    {
      id: 'e3d320b7-b2cf-469a-903f-ead7587d98e9',
      note: 'Updated to check event',
      newValue: 'Mr C test',
      oldValue: 'Mr B Test',
      createdAt: new Date('2025-04-25T13:05:39.937+00:00'),
      createdBy: person2,
      eventType: 'claim-vetsName',
      updatedProperty: 'vetsName'
    },
    {
      id: '2e468208-1f07-46c3-a032-885d5868bd3d',
      note: 'Updated date',
      newValue: new Date('2025-04-25T00:00:00.000Z'),
      oldValue: new Date('2025-04-24T00:00:00.000Z'),
      createdAt: new Date('2025-04-25T13:35:43.53+00:00'),
      createdBy: person2,
      eventType: 'claim-dateOfVisit',
      updatedProperty: 'dateOfVisit'
    },
    {
      id: '0dd471c3-3d22-4093-83d2-ab549bd65a59',
      note: 'updated for checking',
      newValue: '1111111',
      oldValue: '5312363',
      createdAt: new Date('2025-04-28T07:44:06.944+00:00'),
      createdBy: person2,
      eventType: 'claim-vetRCVSNumber',
      updatedProperty: 'vetRCVSNumber'
    }
  ]
}

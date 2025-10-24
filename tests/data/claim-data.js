export const reviewClaim = {
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

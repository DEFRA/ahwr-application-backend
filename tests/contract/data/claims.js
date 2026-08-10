// The 7 claims for the "7 claims exist: ..." provider state - 5 whose applicationReference
// resolves to a document in applications.js, 2 that don't. kept in sync with the consumer fixtures in
// ahwr-backoffice-ui/test/contract/data/claims.js.

export const claims = [
  {
    reference: 'REBC-DN1M-HS6D',
    applicationReference: 'IAHW-5KHC-D7ZN',
    status: 'IN_CHECK',
    type: 'REVIEW',
    createdAt: new Date('2026-08-05T10:55:12.634Z'),
    data: { typeOfLivestock: 'beef' },
    herd: { name: 'Unflagged cattle herd', cph: '11/222/3333' }
  },
  {
    reference: 'REBC-DN1M-HS7D',
    applicationReference: 'IAHW-8888-FLAG',
    status: 'IN_CHECK',
    type: 'REVIEW',
    createdAt: new Date('2026-08-04T10:55:12.634Z'),
    data: { typeOfLivestock: 'beef' },
    herd: { name: 'Flagged cattle herd', cph: '11/222/3233' }
  },
  {
    // herd: {} - not every livestock claim gets a herd (isMultipleHerdsUserJourney can be
    // false), see src/processing/claim/ahwr/processor.js
    reference: 'REBC-DN1M-HS8D',
    applicationReference: 'IAHW-8888-HERD',
    status: 'IN_CHECK',
    type: 'REVIEW',
    createdAt: new Date('2026-08-03T10:55:12.634Z'),
    data: { typeOfLivestock: 'beef' },
    herd: {}
  },
  {
    reference: 'PORE-DJVR-7BJB',
    applicationReference: 'POUL-KUQA-86K7',
    status: 'IN_CHECK',
    type: 'REVIEW',
    createdAt: new Date('2026-08-02T14:20:10.742Z'),
    data: { typesOfPoultry: ['ducks'] },
    herd: { name: 'Unflagged Farm', cph: '12/345/6712' }
  },
  {
    reference: 'PORE-DJVR-6BJB',
    applicationReference: 'POUL-8888-FLAG',
    status: 'IN_CHECK',
    type: 'REVIEW',
    createdAt: new Date('2026-08-01T14:20:10.742Z'),
    data: { typesOfPoultry: ['geese'] },
    herd: { name: 'Flagged Farm', cph: '12/345/6812' }
  },
  {
    reference: 'REBC-9999-ORPH',
    applicationReference: 'IAHW-9999-NOPE',
    status: 'IN_CHECK',
    type: 'REVIEW',
    createdAt: new Date('2026-08-01T10:55:12.634Z'),
    data: { typeOfLivestock: 'beef' },
    herd: { name: 'Orphaned cattle herd', cph: '11/222/3999' }
  },
  {
    reference: 'PORE-9999-ORPH',
    applicationReference: 'POUL-9999-NOPE',
    status: 'IN_CHECK',
    type: 'REVIEW',
    createdAt: new Date('2026-08-02T10:55:12.634Z'),
    data: { typesOfPoultry: ['geese'] },
    herd: { name: 'Orphaned Farm', cph: '12/345/6999' }
  }
]

// The 5 resolving claims for the "7 claims exist: ..." provider state - each applicationReference
// resolves to a document in applications-seed.js. Kept in sync with the consumer fixtures in
// ahwr-backoffice-ui/test/contract/data/claims-response.js.
//
// The 2 orphaned claims aren't listed here - their reference/applicationReference come from the
// consumer's .given() state parameters instead (see buildOrphanedClaim below and its use in
// provider.pact.test.js), since those two fields are the only thing about the orphaned claims
// the consumer's contract actually documents anywhere.

export const resolvingClaims = [
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
  }
]

// Builds an orphaned claim (no resolving application) from the consumer's .given() state
// parameters. Only reference/applicationReference come from the contract - status/type/herd are
// never asserted on, since orphaned claims are excluded from the response entirely and only affect
// the total count. `data` and `createdAt` are still passed explicitly per call though, so the two
// orphaned claims stay distinct records rather than differing only by reference.
export const buildOrphanedClaim = (reference, applicationReference, data, createdAt) => ({
  reference,
  applicationReference,
  status: 'IN_CHECK',
  type: 'REVIEW',
  createdAt: new Date(createdAt),
  data,
  herd: {}
})

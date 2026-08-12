// Applications for the 5 claims in claims-seed.js whose applicationReference should resolve.
// Real values taken from Test env where noted; kept in sync with the consumer fixtures in
// ahwr-backoffice-ui/test/contract/data/claims-response.js. Deliberately no application exists for
// IAHW-9999-NOPE / POUL-9999-NOPE - those are the orphaned claims' non-resolving references.

const flag = { id: '278872ee-ecfa-4d5e-8087-0c0fd7c16ed8', deleted: false }

export const applications = [
  {
    reference: 'IAHW-5KHC-D7ZN',
    status: 'AGREED',
    organisation: { sbi: '106821850' },
    flags: []
  },
  {
    reference: 'IAHW-8888-FLAG',
    status: 'AGREED',
    organisation: { sbi: '106821851' },
    flags: [flag]
  },
  {
    reference: 'IAHW-8888-HERD',
    status: 'AGREED',
    organisation: { sbi: '106821852' },
    flags: []
  },
  {
    reference: 'POUL-KUQA-86K7',
    status: 'AGREED',
    organisation: { sbi: '107234561' },
    flags: []
  },
  {
    reference: 'POUL-8888-FLAG',
    status: 'AGREED',
    organisation: { sbi: '107234562' },
    flags: [flag]
  }
]

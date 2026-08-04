// Real values taken from a claim in Test env (reference REBC-DN1M-HS6D / IAHW-5KHC-D7ZN)
// kept in sync with the consumer fixtures in ahwr-backoffice-ui/test/contract/data/claims.js

export const claim = {
  reference: 'REBC-DN1M-HS6D',
  applicationReference: 'IAHW-5KHC-D7ZN',
  status: 'IN_CHECK',
  type: 'REVIEW',
  createdAt: new Date('2026-07-29T10:55:12.634Z'),
  data: { typeOfLivestock: 'beef' },
  herd: { name: 'Beef Herd', cph: '11/222/3333' }
}

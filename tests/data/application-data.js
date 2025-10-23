export const application = {
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
}

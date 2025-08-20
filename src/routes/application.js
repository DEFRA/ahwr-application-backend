const application = {
  method: 'GET',
  path: '/application',
  handler: (_request, h) => {
    const application = getApplicationFromDatabaseByClaimReference()

    return h.response({ message: 'success', data: application })
  }
}

const getApplicationFromDatabaseByClaimReference = () => {
  // TO DO get from backend service
  return {
    reference: 'IAHW-AAAA-AAAA',
    data: {
      organisation: {
        name: 'Fake org name',
        farmerName: 'Fake farmer name',
        email: 'fake.farmer.email@example.com.test',
        sbi: '0000000000',
        address: '1 fake street,fake town,United Kingdom',
        orgEmail: 'fake.org.email@example.com.test'
      }
    },
    createdAt: new Date()
  }
}

export { application }

const claim = {
  method: 'GET',
  path: '/claim/{reference}',
  handler: (request, h) => {
    const claim = getClaimFromDatabase(request.params.reference)

    return h.response({ message: 'success', data: claim })
  }
}

const getClaimFromDatabase = (claimReference) => {
  // TO DO get from database
  return {
    reference: claimReference,
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
}

export { claim }

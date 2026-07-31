export const getFailedApplicationRedact = async (_requestedDate) => {
  // TODO: 1495 impl
  return []
  // return models.application_redact.findAll({
  //   where: {
  //     requestedDate,
  //     success: 'N'
  //   }
  // })
}

export const createApplicationRedact = async (_data) => {
  // TODO: 1495 impl
  return {}
  // return models.application_redact.create(data)
}

export const updateApplicationRedact = async (
  _id,
  _retryCount,
  _status,
  _success,
  options = {}
) => {
  // TODO: 1495 impl
  return {}
  // return models.application_redact.update(
  //   {
  //     retryCount,
  //     status,
  //     success
  //   },
  //   {
  //     where: { id },
  //     returning: true,
  //     ...options
  //   }
  // )
}

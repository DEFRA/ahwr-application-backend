export const getFailedApplicationRedact = async (requestedDate) => {
  // TODO 1182 impl
  return []
  // return models.application_redact.findAll({
  //   where: {
  //     requestedDate,
  //     success: 'N'
  //   }
  // })
}

export const createApplicationRedact = async (data) => {
  // TODO 1182 impl
  return {}
  // return models.application_redact.create(data)
}

export const updateApplicationRedact = async (
  id,
  retryCount,
  status,
  success,
  options = {}
) => {
  // TODO 1182 impl
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

export async function getAll() {
  // TODO 1182 impl
  return []

  // return models.stage_execution.findAll()
}

export async function getById(id) {
  // TODO 1182 impl
  return {}

  // return models.stage_execution.findOne({
  //   where: { id }
  // })
}

export async function getByApplicationReference(applicationReference) {
  // TODO 1182 impl
  return []

  // return models.stage_execution.findAll({
  //   where: { applicationReference }
  // })
}

export async function set(data) {
  // TODO 1182 impl
  return {}

  // return models.stage_execution.create(data)
}

export async function update(data) {
  // TODO 1182 impl
  return {}

  // return models.stage_execution.update(
  //   { processedAt: new Date() },
  //   {
  //     where: { id: data.id },
  //     returning: true
  //   }
  // )
}

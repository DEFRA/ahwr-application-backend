export const isTodayHoliday = async () => {
  // TODO 1182 impl
  return false

  // const today = new Date().toISOString().split('T')[0]

  // const holiday = await models.holiday.findOne({
  //   where: {
  //     date: today
  //   }
  // })

  // return !!holiday
}

export const set = async (date, description) => {
  // TODO 1182 impl
  return {}

  // return models.holiday.upsert({
  //   date,
  //   description
  // })
}

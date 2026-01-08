// import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library

export const getAllByApplicationReference = async (db, applicationReference, collection) => {
  return db.collection(collection).findOne(
    { reference: applicationReference },
    {
      projection: { _id: 0, contactHistory: 1 }
    }
  )
}

export const updateApplicationValuesAndContactHistory = async ({
  db,
  reference,
  updatedPropertyPathsAndValues,
  contactHistory,
  user,
  updatedAt,
  collection
}) => {
  return db.collection(collection).findOneAndUpdate(
    { reference },
    {
      $set: {
        ...updatedPropertyPathsAndValues,
        updatedAt,
        updatedBy: user
      },
      $push: {
        contactHistory: {
          $each: contactHistory
        }
      }
    },
    { returnDocument: 'after' }
  )
}

export const redactContactHistoryPII = async (applicationReference, logger) => {
  // TODO: 1495 impl
  return {}

  // const data = Sequelize.fn(
  //   'jsonb_set',
  //   Sequelize.fn(
  //     'jsonb_set',
  //     Sequelize.col('data'),
  //     Sequelize.literal("'{newValue}'"),
  //     Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_MULTI_TYPE_VALUE}"'`)
  //   ),
  //   Sequelize.literal("'{oldValue}'"),
  //   Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_MULTI_TYPE_VALUE}"'`)
  // )
  // const [, updatedRows] = await models.contact_history.update(
  //   {
  //     data,
  //     updatedBy: 'admin',
  //     updatedAt: Date.now()
  //   },
  //   {
  //     where: {
  //       applicationReference
  //     },
  //     returning: true
  //   }
  // )

  // updatedRows.forEach((row) => {
  //   const appRef = row.applicationReference
  //   const fieldValue = row.data?.field

  //   logger.info(`Redacted ${fieldValue} in ${appRef}`)
  // })
}

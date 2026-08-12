import { WITHDRAWAL_REQUESTS_COLLECTION } from '../constants/index.js'

export const createWithdrawalRequestIndexes = async (db) => {
  const collection = db.collection(WITHDRAWAL_REQUESTS_COLLECTION)
  await collection.createIndex({ claimReference: 1 })
  await collection.createIndex({ agreementReference: 1 })
  await collection.createIndex({ sbi: 1 })
}

export const createWithdrawalRequest = async ({ db, withdrawalRequest }) => {
  return db.collection(WITHDRAWAL_REQUESTS_COLLECTION).insertOne(withdrawalRequest)
}

export const getWithdrawalRequestByClaimReference = async ({ db, claimReference }) => {
  return db
    .collection(WITHDRAWAL_REQUESTS_COLLECTION)
    .findOne({ claimReference }, { sort: { createdAt: -1 } })
}

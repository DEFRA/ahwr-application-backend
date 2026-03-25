/* global db */

// Switch to (or create) a database, e.g. "testdb"
/* eslint-disable-next-line no-global-assign */
db = db.getSiblingDB('ahwr-application-backend')

db.createCollection('applications')
db.createCollection('claims')
db.createCollection('herds')
db.createCollection('owapplications')

const fs = require('fs')

// Convert ISO date strings to Date objects for proper MongoDB date handling
const convertDates = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(convertDates)

  const dateFields = ['createdAt', 'updatedAt', 'dateOfVisit', 'dateOfTesting', 'associatedAt']
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (dateFields.includes(key) && typeof value === 'string') {
      result[key] = new Date(value)
    } else if (typeof value === 'object') {
      result[key] = convertDates(value)
    } else {
      result[key] = value
    }
  }
  return result
}

const raw = fs.readFileSync('/temp/DevNewWorldApplications.json')
const rawOld = fs.readFileSync('/temp/DevOldWorldApplications.json')
const rawClaims = fs.readFileSync('/temp/DevClaims.json')
let docs = JSON.parse(raw).map(convertDates)
db.applications.insertMany(docs)
docs = JSON.parse(rawOld).map(convertDates)
db.owapplications.insertMany(docs)
docs = JSON.parse(rawClaims).map(convertDates)
db.claims.insertMany(docs)

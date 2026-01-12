/* global db */

// Switch to (or create) a database, e.g. "testdb"
/* eslint-disable-next-line no-global-assign */
db = db.getSiblingDB('ahwr-application-backend')

db.createCollection('applications')
db.createCollection('claims')
db.createCollection('herds')
db.createCollection('owapplications')

const fs = require('fs')
const raw = fs.readFileSync('/temp/DevNewWorldApplications.json')
const rawOld = fs.readFileSync('/temp/DevOldWorldApplications.json')
const rawClaims = fs.readFileSync('/temp/DevClaims.json')
let docs = JSON.parse(raw)
db.applications.insertMany(docs)
docs = JSON.parse(rawOld)
db.owapplications.insertMany(docs)
docs = JSON.parse(rawClaims)
db.claims.insertMany(docs)

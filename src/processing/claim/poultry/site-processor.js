import { createHerd, getHerdById } from '../../../repositories/herd-repository.js'
import crypto from 'node:crypto'

const buildNewSite = (site, species, applicationReference, createdBy) => ({
  id: crypto.randomUUID(),
  version: 1,
  applicationReference,
  species,
  name: site.name,
  cph: site.cph,
  createdBy,
  isCurrent: true
})

const createOrGetSite = async (site, species, applicationReference, createdBy, db) => {
  const existingSite = await getHerdById(db, site.id)

  if (existingSite) {
    return { siteData: existingSite, created: false }
  }

  const siteData = buildNewSite(site, species, applicationReference, createdBy)
  await createHerd(db, siteData)
  return { siteData, created: true }
}

export const processSite = async ({ site, species, applicationReference, createdBy, db }) => {
  const { siteData, created } = await createOrGetSite(
    site,
    species,
    applicationReference,
    createdBy,
    db
  )

  const claimSiteData = {
    id: siteData.id,
    version: siteData.version,
    cph: site.cph,
    name: site.name,
    associatedAt: new Date()
  }

  return {
    siteData,
    claimSiteData,
    created
  }
}

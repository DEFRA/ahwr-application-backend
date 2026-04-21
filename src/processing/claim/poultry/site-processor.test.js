import crypto from 'crypto'
import { createHerd, getHerdById } from '../../../repositories/herd-repository.js'
import { processSite } from './site-processor.js'

jest.mock('crypto')
jest.mock('../../../repositories/herd-repository.js')

describe('processSite', () => {
  const db = {}
  const createdBy = 'admin'
  const applicationReference = 'POUL-8ZPZ-8CLI'

  beforeEach(() => {
    jest.clearAllMocks()
    crypto.randomUUID.mockReturnValue('01d6b3f1-3fa2-465e-8dc7-cc28393ba902')
  })

  describe('create new site', () => {
    it('creates a new site when it does not exist in the database', async () => {
      getHerdById.mockResolvedValue(null)
      createHerd.mockResolvedValueOnce()
      const site = {
        id: 'temp-site-id',
        version: 1,
        name: 'Poultry Site A',
        cph: '12/345/6789'
      }

      const result = await processSite({
        site,
        species: ['broilers'],
        applicationReference,
        createdBy,
        db
      })

      expect(getHerdById).toHaveBeenCalledWith(db, 'temp-site-id')
      expect(createHerd).toHaveBeenCalledWith(
        db,
        expect.objectContaining({
          id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
          version: 1,
          name: 'Poultry Site A',
          cph: '12/345/6789',
          species: ['broilers'],
          createdBy,
          applicationReference,
          isCurrent: true
        })
      )
      expect(result.created).toBe(true)
      expect(result.siteData.id).toBe('01d6b3f1-3fa2-465e-8dc7-cc28393ba902')
      expect(result.claimSiteData).toEqual({
        id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
        version: 1,
        cph: '12/345/6789',
        name: 'Poultry Site A',
        associatedAt: expect.any(Date)
      })
    })
  })

  describe('existing site', () => {
    it('returns existing site without creating when site already exists in database', async () => {
      const existingSite = {
        id: '8ec1fc51-bd6f-40a2-8c37-d21696884a42',
        version: 1,
        name: 'Existing Poultry Site',
        cph: '12/345/6789',
        species: ['broilers'],
        applicationReference,
        createdBy: 'admin',
        isCurrent: true
      }
      getHerdById.mockResolvedValue(existingSite)

      const site = {
        id: '8ec1fc51-bd6f-40a2-8c37-d21696884a42',
        version: 2,
        name: 'Poultry Site A',
        cph: '12/345/6789'
      }

      const result = await processSite({
        site,
        species: ['broilers'],
        applicationReference,
        createdBy,
        db
      })

      expect(getHerdById).toHaveBeenCalledWith(db, '8ec1fc51-bd6f-40a2-8c37-d21696884a42')
      expect(createHerd).not.toHaveBeenCalled()
      expect(result.created).toBe(false)
      expect(result.siteData).toEqual(existingSite)
      expect(result.claimSiteData).toEqual({
        id: '8ec1fc51-bd6f-40a2-8c37-d21696884a42',
        version: 1,
        cph: '12/345/6789',
        name: 'Poultry Site A',
        associatedAt: expect.any(Date)
      })
    })
  })
})

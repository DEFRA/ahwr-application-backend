import crypto from 'crypto'
import {
  createHerd,
  getHerdById,
  updateIsCurrentHerd
} from '../../../repositories/herd-repository.js'
import {
  addHerdToClaimData,
  getByApplicationReference
} from '../../../repositories/claim-repository.js'
import { arraysAreEqual } from '../../../lib/array-utils.js'
import { processHerd } from './herd-processor.js'
import { raiseHerdEvent } from '../../../event-publisher/index.js'

jest.mock('crypto')
jest.mock('../../../repositories/herd-repository.js')
jest.mock('../../../repositories/claim-repository.js')
jest.mock('../../../lib/array-utils.js')
jest.mock('../../../event-publisher/index.js')

describe('processHerd', () => {
  const logger = { info: jest.fn() }
  const db = {}
  const createdBy = 'admin'
  const applicationReference = 'IAHW-8ZPZ-8CLI'
  const sbi = '123456789'
  const typeOfLivestock = 'beef'

  beforeEach(() => {
    jest.clearAllMocks()
    arraysAreEqual.mockImplementation((a, b) => JSON.stringify(a) === JSON.stringify(b))
    crypto.randomUUID.mockReturnValue('01d6b3f1-3fa2-465e-8dc7-cc28393ba902')
  })

  describe('processHerd', () => {
    describe('create new herd', () => {
      it('creates a new herd when version is 1', async () => {
        createHerd.mockResolvedValueOnce()
        const herd = {
          version: 1,
          name: 'Herd A',
          cph: '12/345/6789',
          reasons: ['uniqueHealthNeeds'],
          same: false
        }

        const result = await processHerd({
          herd,
          applicationReference,
          createdBy,
          typeOfLivestock,
          sbi,
          logger,
          db
        })

        expect(createHerd).toHaveBeenCalledWith(
          db,
          expect.objectContaining({
            id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
            version: 1,
            name: 'Herd A',
            cph: '12/345/6789',
            createdBy,
            applicationReference
          })
        )
        expect(result.updated).toBe(true)
        expect(result.herdData.id).toBe('01d6b3f1-3fa2-465e-8dc7-cc28393ba902')
        expect(logger.info).not.toHaveBeenCalledWith('Herd has not changed')
      })
    })

    describe('update herd', () => {
      const existingHerd = {
        id: '8ec1fc51-bd6f-40a2-8c37-d21696884a42',
        version: 2,
        cph: '12/345/6789',
        reasons: ['uniqueHealthNeeds'],
        isCurrent: true,
        name: 'Old Herd',
        species: 'sheep'
      }

      it('updates existing herd when herd data has changed', async () => {
        getHerdById.mockResolvedValue(existingHerd)
        createHerd.mockResolvedValue()
        updateIsCurrentHerd.mockResolvedValue()
        const herd = {
          ...existingHerd,
          version: 3,
          cph: '81/445/6789',
          reasons: ['separateManagementNeeds']
        }

        const result = await processHerd({
          herd,
          applicationReference,
          createdBy,
          typeOfLivestock,
          sbi,
          logger,
          db
        })

        expect(getHerdById).toHaveBeenCalledWith(db, herd.id)
        expect(createHerd).toHaveBeenCalledWith(db, {
          id: existingHerd.id,
          version: existingHerd.version + 1,
          cph: '81/445/6789',
          reasons: ['separateManagementNeeds'],
          applicationReference,
          createdBy,
          isCurrent: true,
          name: existingHerd.name,
          species: existingHerd.species
        })
        expect(updateIsCurrentHerd).toHaveBeenCalledWith(db, herd.id, false, existingHerd.version)
        expect(result.updated).toBe(true)
      })

      it('should not update herd when herd data is unchanged', async () => {
        const herd = { ...existingHerd, version: 3 }
        getHerdById.mockResolvedValue(existingHerd)
        arraysAreEqual.mockReturnValue(true)

        const result = await processHerd({
          herd,
          applicationReference,
          createdBy,
          typeOfLivestock,
          sbi,
          logger,
          db
        })

        expect(createHerd).not.toHaveBeenCalled()
        expect(logger.info).toHaveBeenCalledWith('Herd has not changed')
        expect(result.updated).toBe(false)
      })

      it('throws error when updating a non-current version of a herd', async () => {
        const herd = { ...existingHerd, version: 3 }
        getHerdById.mockResolvedValue({ ...existingHerd, isCurrent: false })

        await expect(
          processHerd({
            herd,
            applicationReference,
            createdBy,
            typeOfLivestock,
            sbi,
            logger,
            db
          })
        ).rejects.toThrow('Attempting to update an older version of a herd')
      })
    })

    describe('associate herd with previous claims', () => {
      it('adds herd to previous claims when updating the same herd', async () => {
        const herd = {
          version: 1,
          name: 'Herd B',
          cph: '81/445/6789',
          reasons: ['separateManagementNeeds'],
          same: 'yes'
        }
        createHerd.mockResolvedValueOnce()
        getByApplicationReference.mockResolvedValue([
          { reference: 'RESH-O9UD-0025', herd: null },
          {
            reference: 'REBC-O9UD-0026',
            herd: { id: '8ec1fc51-bd6f-40a2-8c37-d21696884a42' }
          }
        ])
        addHerdToClaimData.mockResolvedValue()

        await processHerd({
          herd,
          applicationReference,
          createdBy,
          typeOfLivestock,
          sbi,
          logger,
          db
        })

        expect(getByApplicationReference).toHaveBeenCalledWith({
          applicationReference,
          typeOfLivestock,
          db
        })
        expect(addHerdToClaimData).toHaveBeenCalledTimes(1)
        expect(addHerdToClaimData).toHaveBeenCalledWith({
          claimRef: 'RESH-O9UD-0025',
          createdBy,
          db,
          claimHerdData: {
            associatedAt: expect.any(Date),
            cph: '81/445/6789',
            id: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
            name: 'Herd B',
            reasons: ['separateManagementNeeds'],
            version: 1
          }
        })
        expect(raiseHerdEvent).toHaveBeenCalledWith({
          sbi,
          message: 'Herd associated with claim',
          type: 'claim-herdAssociated',
          data: {
            herdId: '01d6b3f1-3fa2-465e-8dc7-cc28393ba902',
            herdVersion: 1,
            reference: 'RESH-O9UD-0025',
            applicationReference
          }
        })
      })
    })
  })
})

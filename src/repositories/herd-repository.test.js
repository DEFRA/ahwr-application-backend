import { getHerdsByAppRefAndSpecies, updateHerdName } from './herd-repository'

describe('herd-repository', () => {
  const dbMock = {
    collection: jest.fn(() => collectionMock)
  }
  const collectionMock = {
    toArray: jest.fn(),
    find: jest.fn().mockReturnThis(),
    updateOne: jest.fn().mockReturnThis()
  }

  describe('getHerdsByAppRefAndSpecies', () => {
    it('should return herds that matches species and applicationReference', async () => {
      const mockResult = [
        {
          id: '40ba22b3-cfdc-4d8c-b491-13873ec97439',
          cph: '11/232/4349',
          name: 'Sheep herd 1',
          reasons: ['onlyHerd'],
          species: 'sheep',
          version: 1,
          createdAt: new Date('2025-07-14T13:17:55.380989+00:00'),
          createdBy: 'admin',
          isCurrent: true,
          updatedAt: new Date('2025-08-14T08:16:44.521+00:00'),
          updatedBy: 'admin',
          applicationReference: 'IAHW-G3CL-V59P'
        }
      ]
      collectionMock.toArray.mockResolvedValue(mockResult)

      const result = await getHerdsByAppRefAndSpecies({
        db: dbMock,
        applicationReference: 'IAHW-G3CL-V59P',
        species: 'sheep'
      })

      expect(dbMock.collection).toHaveBeenCalledWith('herds')
      expect(collectionMock.find).toHaveBeenCalledWith({
        applicationReference: 'IAHW-G3CL-V59P',
        isCurrent: true,
        species: 'sheep'
      })
      expect(result).toEqual(mockResult)
    })
  })

  describe('updateHerdName', () => {
    it('should update herd name property', async () => {
      await updateHerdName({
        id: 'fake-herd-id',
        version: 1,
        name: 'Backyard Sheeps',
        updatedBy: 'unit-test',
        db: dbMock
      })

      expect(dbMock.collection).toHaveBeenCalledWith('herds')
      expect(collectionMock.updateOne).toHaveBeenCalledWith(
        { id: 'fake-herd-id', version: 1 },
        {
          $set: {
            name: 'Backyard Sheeps',
            updatedAt: expect.any(Date),
            updatedBy: 'unit-test'
          }
        }
      )
    })
  })
})

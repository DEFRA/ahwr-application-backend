import { getAllFlags } from './flag-repository'

describe('flag-repository', () => {
  const dbMock = {
    collection: jest.fn(() => collectionMock)
  }
  const toArrayMock = jest.fn()
  const collectionMock = {
    aggregate: jest.fn(() => ({
      toArray: toArrayMock
    }))
  }

  describe('getAllFlags', () => {
    it('should return new world and old world application flags', async () => {
      const mockResult = [
        {
          id: '0b401d15-b594-4bce-851a-0f676f1ce5a6',
          note: "User did not agree with multi herds T&C's",
          deleted: true,
          createdAt: new Date('2025-04-30T10:42:04.707Z'),
          createdBy: 'Rob Catton (EqualExperts)',
          deletedAt: new Date('2025-04-30T10:50:55.169Z'),
          deletedBy: 'Rob Catton (EqualExperts)',
          appliesToMh: true,
          deletedNote: "User has changed their mind and accepted the T&C's",
          applicationReference: 'IAHW-G3CL-V59P',
          sbi: '123456789'
        },
        {
          id: '98b575f0-82cf-46ca-9034-1002b2bf6bec',
          note: 'This user lies a lot on their claims.',
          deleted: true,
          createdAt: new Date('2025-04-30T10:43:01.066Z'),
          createdBy: 'Rob Catton (EqualExperts)',
          deletedAt: new Date('2025-06-23T07:42:12.104Z'),
          deletedBy: 'Carroll, Aaron',
          appliesToMh: false,
          deletedNote: 'no they do not',
          applicationReference: 'AHWR-G3CL-V59P',
          sbi: '123456789'
        }
      ]
      toArrayMock.mockResolvedValue(mockResult)

      const result = await getAllFlags(dbMock)

      expect(dbMock.collection).toHaveBeenCalledWith('applications')
      expect(collectionMock.aggregate).toHaveBeenCalled()
      expect(result).toEqual(mockResult)
    })
  })
})

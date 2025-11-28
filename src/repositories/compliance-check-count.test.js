import { getAndIncrementComplianceCheckCount } from './compliance-check-count'

describe('getAndIncrementComplianceCheckCount', () => {
  it('should call findOneAndUpdate with correct args and return updated count', async () => {
    const mockNow = new Date('2024-01-01T00:00:00Z')
    jest.spyOn(global, 'Date').mockImplementation(() => mockNow)
    const findOneAndUpdate = jest.fn().mockResolvedValue({
      count: 5
    })
    const db = {
      collection: jest.fn().mockReturnValue({
        findOneAndUpdate
      })
    }

    const count = await getAndIncrementComplianceCheckCount(db)

    expect(count).toBe(5)
    expect(db.collection).toHaveBeenCalledWith('compliancecheckcount')
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 1 },
      {
        $inc: { count: 1 },
        $set: { updatedAt: mockNow },
        $setOnInsert: { createdAt: mockNow }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
  })
})

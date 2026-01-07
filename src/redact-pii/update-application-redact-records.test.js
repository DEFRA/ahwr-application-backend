import { updateApplicationRedactRecords } from './update-application-redact-records'
import { updateApplicationRedact } from '../repositories/application-redact-repository'

jest.mock('../repositories/application-redact-repository')

// jest.mock('../../../../app/data/index.js', () => {
//   const mockTransaction = { id: 1 }

//   return ({
//     buildData: {
//       sequelize: { transaction: jest.fn(async (callback) => callback(mockTransaction)) }
//     }
//   })
// })

describe('update-application-redact-records redactPII', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call updateApplicationRedact for each agreement without incrementing retry count', async () => {
    const agreements = [
      { id: 1, retryCount: 0 },
      { id: 2, retryCount: 5 }
    ]
    const status = ['applications-to-redact', 'documents']
    const success = true

    await updateApplicationRedactRecords(agreements, false, status, success)

    expect(updateApplicationRedact).toHaveBeenCalledTimes(2)
    // TODO 1182 add mongodb transactions
    // expect(updateApplicationRedact).toHaveBeenCalledWith(1, 0, 'applications-to-redact,documents', true, { transaction: { id: 1 } })
    expect(updateApplicationRedact).toHaveBeenCalledWith(
      1,
      0,
      'applications-to-redact,documents',
      true
    )
    // expect(updateApplicationRedact).toHaveBeenCalledWith(2, 5, 'applications-to-redact,documents', true, { transaction: { id: 1 } })
    expect(updateApplicationRedact).toHaveBeenCalledWith(
      2,
      5,
      'applications-to-redact,documents',
      true
    )
  })

  it('should increment retryCount when incrementRetryCount is true', async () => {
    const agreements = [
      { id: 1, retryCount: 0 },
      { id: 2, retryCount: 5 }
    ]
    const status = ['applications-to-redact', 'documents']
    const success = false

    await updateApplicationRedactRecords(agreements, true, status, success)

    expect(updateApplicationRedact).toHaveBeenCalledTimes(2)
    // TODO 1182 add mongodb transactions
    // expect(updateApplicationRedact).toHaveBeenCalledWith(1, 1, 'applications-to-redact,documents', false, { transaction: { id: 1 } })
    expect(updateApplicationRedact).toHaveBeenCalledWith(
      1,
      1,
      'applications-to-redact,documents',
      false
    )
    // expect(updateApplicationRedact).toHaveBeenCalledWith(1, 1, 'applications-to-redact,documents', false, { transaction: { id: 1 } })
    expect(updateApplicationRedact).toHaveBeenCalledWith(
      1,
      1,
      'applications-to-redact,documents',
      false
    )
    // expect(updateApplicationRedact).toHaveBeenCalledWith(2, 6, 'applications-to-redact,documents', false, { transaction: { id: 1 } })
    expect(updateApplicationRedact).toHaveBeenCalledWith(
      2,
      6,
      'applications-to-redact,documents',
      false
    )
  })

  it('should return when no applications to redact', async () => {
    await updateApplicationRedactRecords([], true, ['applications-to-redact', 'documents'], true)

    expect(updateApplicationRedact).not.toHaveBeenCalled()
  })

  // TODO throws error
})

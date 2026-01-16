import { processOnHoldClaims } from './process-on-hold.js'
import { findOnHoldClaims, updateClaimStatuses } from '../repositories/claim-repository.js'
import { getLogger } from '../logging/logger.js'
import { STATUS } from 'ffc-ahwr-common-library'
import {
  publishRequestForPaymentEvent,
  publishStatusChangeEvent
} from '../messaging/publish-outbound-notification.js'
import { ObjectId } from 'mongodb'
import { getApplication } from '../repositories/application-repository.js'
import { raiseClaimEvents } from '../event-publisher/index.js'

jest.mock('../messaging/publish-outbound-notification.js')
jest.mock('../repositories/application-repository.js')
jest.mock('../repositories/claim-repository.js')
jest.mock('../logging/logger.js')
jest.mock('../event-publisher/index.js')

describe('processOnHoldClaims', () => {
  let mockDb
  let mockInfo
  let mockError

  const objectIdString = '507f191e810c19729de860ea'
  const claimsFromDb = [
    {
      applicationReference: 'IAHW-RWE2-G8S7',
      reference: 'REBC-DJ32-LDNF',
      status: 'ON_HOLD',
      type: 'REVIEW',
      data: {
        typeOfLivestock: 'beef',
        reviewTestResults: 'positive',
        dateOfVisit: new Date(),
        piHunt: 'no',
        piHuntRecommended: 'no',
        piHuntAllAnimals: 'no',
        amount: 300
      },
      herd: { name: 'Beefers' },
      _id: new ObjectId(objectIdString)
    },
    {
      applicationReference: 'IAHW-RWE2-G8S7',
      reference: 'FUSH-HD33-P99I',
      status: 'ON_HOLD',
      type: 'REVIEW',
      data: {
        typeOfLivestock: 'beef',
        reviewTestResults: 'positive',
        dateOfVisit: new Date(),
        piHunt: 'yes',
        piHuntRecommended: 'yes',
        piHuntAllAnimals: 'yes',
        amount: 300
      },
      herd: { name: 'Beefers' },
      _id: new ObjectId(objectIdString)
    }
  ]
  const mockDate = new Date()

  beforeEach(() => {
    jest.resetAllMocks()
    mockDb = {}
    mockInfo = jest.fn()
    mockError = jest.fn()
    getLogger.mockReturnValue({ error: mockError, info: mockInfo })
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
  })

  it('moves claims from on hold to ready to pay when there are on hold claims', async () => {
    const organisation = {
      sbi: '106705779',
      crn: '1100014934',
      frn: '1102569649'
    }

    findOnHoldClaims.mockResolvedValue(claimsFromDb)
    updateClaimStatuses.mockResolvedValue({ updatedRecordCount: 2 })

    getApplication.mockResolvedValue({
      organisation
    })

    await processOnHoldClaims(mockDb)

    expect(findOnHoldClaims).toHaveBeenCalledWith(expect.objectContaining({ db: mockDb }))
    expect(updateClaimStatuses).toHaveBeenCalledWith(
      expect.objectContaining({
        db: mockDb,
        references: [claimsFromDb[0].reference, claimsFromDb[1].reference],
        status: STATUS.READY_TO_PAY,
        user: 'admin',
        updatedAt: mockDate
      })
    )

    expect(publishStatusChangeEvent).toHaveBeenCalledWith(
      { error: mockError, info: mockInfo },
      {
        crn: organisation.crn,
        sbi: organisation.sbi,
        agreementReference: claimsFromDb[0].applicationReference,
        claimReference: claimsFromDb[0].reference,
        claimStatus: 'READY_TO_PAY',
        claimType: claimsFromDb[0].type,
        dateTime: mockDate,
        herdName: claimsFromDb[0].herd.name,
        typeOfLivestock: claimsFromDb[0].data.typeOfLivestock,
        reviewTestResults: claimsFromDb[0].data.reviewTestResults,
        piHuntRecommended: claimsFromDb[0].data.piHuntRecommended,
        piHuntAllAnimals: claimsFromDb[0].data.piHuntAllAnimals,
        claimAmount: 300
      }
    )

    expect(publishStatusChangeEvent).toHaveBeenCalledWith(
      { error: mockError, info: mockInfo },
      {
        crn: organisation.crn,
        sbi: organisation.sbi,
        agreementReference: claimsFromDb[1].applicationReference,
        claimReference: claimsFromDb[1].reference,
        claimStatus: 'READY_TO_PAY',
        claimType: claimsFromDb[1].type,
        dateTime: mockDate,
        herdName: claimsFromDb[1].herd.name,
        typeOfLivestock: claimsFromDb[1].data.typeOfLivestock,
        reviewTestResults: claimsFromDb[1].data.reviewTestResults,
        piHuntRecommended: claimsFromDb[1].data.piHuntRecommended,
        piHuntAllAnimals: claimsFromDb[1].data.piHuntAllAnimals,
        claimAmount: 300
      }
    )

    expect(publishRequestForPaymentEvent).toHaveBeenCalledWith(
      { error: mockError, info: mockInfo },
      {
        reference: claimsFromDb[0].reference,
        sbi: organisation.sbi,
        whichReview: claimsFromDb[0].data.typeOfLivestock,
        isEndemics: true,
        claimType: claimsFromDb[0].type,
        dateOfVisit: mockDate,
        reviewTestResults: claimsFromDb[0].data.reviewTestResults,
        frn: organisation.frn,
        optionalPiHuntValue: 'noPiHunt'
      }
    )

    expect(publishRequestForPaymentEvent).toHaveBeenCalledWith(
      { error: mockError, info: mockInfo },
      {
        reference: claimsFromDb[1].reference,
        sbi: organisation.sbi,
        whichReview: claimsFromDb[1].data.typeOfLivestock,
        isEndemics: true,
        claimType: claimsFromDb[1].type,
        dateOfVisit: mockDate,
        reviewTestResults: claimsFromDb[1].data.reviewTestResults,
        frn: organisation.frn,
        optionalPiHuntValue: 'yesPiHunt'
      }
    )

    expect(mockInfo).toHaveBeenCalledWith('Of 2 claims on hold, 2 updated to ready to pay.')

    expect(raiseClaimEvents).toHaveBeenNthCalledWith(
      1,
      {
        message: 'Claim has been updated',
        claim: { ...claimsFromDb[0], status: 'READY_TO_PAY', id: objectIdString },
        raisedBy: 'admin',
        raisedOn: mockDate,
        note: 'Automatic update'
      },
      '106705779'
    )

    expect(raiseClaimEvents).toHaveBeenNthCalledWith(
      2,
      {
        message: 'Claim has been updated',
        claim: { ...claimsFromDb[1], status: 'READY_TO_PAY', id: objectIdString },
        raisedBy: 'admin',
        raisedOn: mockDate,
        note: 'Automatic update'
      },
      '106705779'
    )
  })

  it('works without organization information', async () => {
    findOnHoldClaims.mockResolvedValue(claimsFromDb)
    updateClaimStatuses.mockResolvedValue({ updatedRecordCount: 2 })

    getApplication.mockResolvedValue({
      organisation: undefined
    })

    await processOnHoldClaims(mockDb)

    expect(findOnHoldClaims).toHaveBeenCalledWith(expect.objectContaining({ db: mockDb }))
    expect(updateClaimStatuses).toHaveBeenCalledWith(
      expect.objectContaining({
        db: mockDb,
        references: [claimsFromDb[0].reference, claimsFromDb[1].reference],
        status: STATUS.READY_TO_PAY,
        user: 'admin',
        updatedAt: mockDate
      })
    )

    expect(publishStatusChangeEvent).toHaveBeenCalledWith(
      { error: mockError, info: mockInfo },
      {
        crn: undefined,
        sbi: undefined,
        agreementReference: claimsFromDb[0].applicationReference,
        claimReference: claimsFromDb[0].reference,
        claimStatus: 'READY_TO_PAY',
        claimType: claimsFromDb[0].type,
        dateTime: mockDate,
        herdName: claimsFromDb[0].herd.name,
        typeOfLivestock: claimsFromDb[0].data.typeOfLivestock,
        reviewTestResults: claimsFromDb[0].data.reviewTestResults,
        piHuntRecommended: claimsFromDb[0].data.piHuntRecommended,
        piHuntAllAnimals: claimsFromDb[0].data.piHuntAllAnimals,
        claimAmount: 300
      }
    )

    expect(publishStatusChangeEvent).toHaveBeenCalledWith(
      { error: mockError, info: mockInfo },
      {
        crn: undefined,
        sbi: undefined,
        agreementReference: claimsFromDb[1].applicationReference,
        claimReference: claimsFromDb[1].reference,
        claimStatus: 'READY_TO_PAY',
        claimType: claimsFromDb[1].type,
        dateTime: mockDate,
        herdName: claimsFromDb[1].herd.name,
        typeOfLivestock: claimsFromDb[1].data.typeOfLivestock,
        reviewTestResults: claimsFromDb[1].data.reviewTestResults,
        piHuntRecommended: claimsFromDb[1].data.piHuntRecommended,
        piHuntAllAnimals: claimsFromDb[1].data.piHuntAllAnimals,
        claimAmount: 300
      }
    )

    expect(publishRequestForPaymentEvent).toHaveBeenCalledWith(
      { error: mockError, info: mockInfo },
      {
        reference: claimsFromDb[0].reference,
        sbi: undefined,
        whichReview: claimsFromDb[0].data.typeOfLivestock,
        isEndemics: true,
        claimType: claimsFromDb[0].type,
        dateOfVisit: mockDate,
        reviewTestResults: claimsFromDb[0].data.reviewTestResults,
        frn: undefined,
        optionalPiHuntValue: 'noPiHunt'
      }
    )

    expect(publishRequestForPaymentEvent).toHaveBeenCalledWith(
      { error: mockError, info: mockInfo },
      {
        reference: claimsFromDb[1].reference,
        sbi: undefined,
        whichReview: claimsFromDb[1].data.typeOfLivestock,
        isEndemics: true,
        claimType: claimsFromDb[1].type,
        dateOfVisit: mockDate,
        reviewTestResults: claimsFromDb[1].data.reviewTestResults,
        frn: undefined,
        optionalPiHuntValue: 'yesPiHunt'
      }
    )

    expect(mockInfo).toHaveBeenCalledWith('Of 2 claims on hold, 2 updated to ready to pay.')

    expect(raiseClaimEvents).toHaveBeenNthCalledWith(
      1,
      {
        message: 'Claim has been updated',
        claim: { ...claimsFromDb[0], status: 'READY_TO_PAY', id: objectIdString },
        raisedBy: 'admin',
        raisedOn: mockDate,
        note: 'Automatic update'
      },
      undefined
    )

    expect(raiseClaimEvents).toHaveBeenNthCalledWith(
      2,
      {
        message: 'Claim has been updated',
        claim: { ...claimsFromDb[1], status: 'READY_TO_PAY', id: objectIdString },
        raisedBy: 'admin',
        raisedOn: mockDate,
        note: 'Automatic update'
      },
      undefined
    )
  })

  it('does nothing when there are no hold claims', async () => {
    const fakeClaims = []
    findOnHoldClaims.mockResolvedValue(fakeClaims)

    await processOnHoldClaims(mockDb)

    expect(findOnHoldClaims).toHaveBeenCalledWith(expect.objectContaining({ db: mockDb }))
    expect(updateClaimStatuses).not.toHaveBeenCalled()
    expect(mockInfo).toHaveBeenCalledWith('No claims to move from on hold to ready to pay.')
  })
})

import {
  publishDocumentRequestEvent,
  publishReminderEvent,
  publishRequestForPaymentEvent,
  publishStatusChangeEvent
} from './publish-outbound-notification.js'
import { publishMessage, setupClient } from 'ffc-ahwr-common-library'
import { config } from '../config/config.js'
import { metricsCounter } from '../common/helpers/metrics.js'

jest.mock('ffc-ahwr-common-library')
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  setBindings: jest.fn()
}
jest.mock('../common/helpers/metrics.js')

describe('publish outbound notification', () => {
  beforeAll(() => {
    config.set('sns.documentRequestedTopicArn', 'arn:aws:sns:eu-west-2:1:document-requested')
    config.set('sns.statusChangeTopicArn', 'arn:aws:sns:eu-west-2:1:status-change')
    config.set('sns.paymentRequestTopicArn', 'arn:aws:sns:eu-west-2:1:payment-request')
    config.set('sns.reminderRequestedTopicArn', 'arn:aws:sns:eu-west-2:1:reminder-request')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('publishDocumentRequestEvent', () => {
    test('sets up client and then publishes document request event on first call', async () => {
      const startDate = new Date()
      const inputMessageBody = {
        reference: 'ABC123',
        sbi: 'sbi123',
        startDate,
        userType: 'newUser',
        email: 'farmer@farms.com',
        farmerName: 'farmer',
        orgData: {
          orgName: 'any old business',
          orgEmail: 'somebusiness@nowhere.net',
          crn: '123456789'
        }
      }
      await publishDocumentRequestEvent(mockLogger, inputMessageBody)

      expect(setupClient).toHaveBeenCalledTimes(1)
      expect(publishMessage).toHaveBeenCalledWith(
        inputMessageBody,
        {
          eventType: config.get('messageTypes.applicationDocRequestMsgType')
        },
        'arn:aws:sns:eu-west-2:1:document-requested'
      )
      expect(metricsCounter).toHaveBeenCalledWith('notification_published-document-request')
    })

    test('skips setting up client and then publishes event on subsequent call', async () => {
      const startDate = new Date()
      const inputMessageBody = {
        reference: 'ABC123',
        sbi: 'sbi123',
        startDate,
        userType: 'newUser',
        email: 'farmer@farms.com',
        farmerName: 'farmer',
        orgData: {
          orgName: 'any old business',
          orgEmail: 'somebusiness@nowhere.net',
          crn: '123456789'
        }
      }

      await publishDocumentRequestEvent(mockLogger, inputMessageBody)

      expect(setupClient).toHaveBeenCalledTimes(0)
      expect(publishMessage).toHaveBeenCalledWith(
        inputMessageBody,
        {
          eventType: config.get('messageTypes.applicationDocRequestMsgType')
        },
        'arn:aws:sns:eu-west-2:1:document-requested'
      )
      expect(metricsCounter).toHaveBeenCalledWith('notification_published-document-request')
    })
  })

  describe('publishStatusChangeEvent', () => {
    test('publishes status change event message', async () => {
      const inputMessageBody = {
        sbi: '1234567',
        agreementReference: 'IAHW-RWE2-G8S7',
        claimReference: 'REBC-ABCD-1234',
        claimStatus: 'PAID',
        claimType: 'REVIEW',
        typeOfLivestock: 'beef',
        dateTime: new Date('2025-11-21T14:17:20.084Z'),
        herdName: 'Unnamed herd'
      }

      await publishStatusChangeEvent(mockLogger, inputMessageBody)

      expect(setupClient).toHaveBeenCalledTimes(0)
      expect(publishMessage).toHaveBeenCalledWith(
        inputMessageBody,
        {
          eventType: 'uk.gov.ffc.ahwr.claim.status.update'
        },
        'arn:aws:sns:eu-west-2:1:status-change'
      )
      expect(metricsCounter).toHaveBeenCalledWith('notification_published-claim-status-change')
    })
  })

  describe('publishRequestForPaymentEvent', () => {
    test('publishes request for payment message', async () => {
      const inputMessageBody = {
        reviewTestResults: 'positive',
        reference: 'REBC-ABCD-1234',
        sbi: '123456789',
        frn: '123',
        claimType: 'FOLLOW_UP',
        whichReview: 'beef',
        optionalPiHuntValue: 'yesPiHunt',
        isEndemics: true,
        dateTime: new Date('2025-11-21T14:17:20.084Z')
      }

      await publishRequestForPaymentEvent(mockLogger, inputMessageBody)

      expect(setupClient).toHaveBeenCalledTimes(0)
      expect(publishMessage).toHaveBeenCalledWith(
        inputMessageBody,
        {
          eventType: 'uk.gov.ffc.ahwr.submit.payment.request'
        },
        'arn:aws:sns:eu-west-2:1:payment-request'
      )
      expect(metricsCounter).toHaveBeenCalledWith('notification_published-payment-request')
    })
  })

  describe('publishReminderEvent', () => {
    test('publishes reminder message', async () => {
      const inputMessageBody = {
        agreementReference: 'IAHW-ABCD-1234',
        sbi: '123456789',
        dateTime: new Date('2025-11-21T14:17:20.084Z')
      }

      await publishReminderEvent(mockLogger, inputMessageBody)

      expect(setupClient).toHaveBeenCalledTimes(0)
      expect(publishMessage).toHaveBeenCalledWith(
        inputMessageBody,
        {
          eventType: 'uk.gov.ffc.ahwr.agreement.reminder.email'
        },
        'arn:aws:sns:eu-west-2:1:reminder-request'
      )
      expect(metricsCounter).toHaveBeenCalledWith('notification_published-reminder-request')
    })
  })
})

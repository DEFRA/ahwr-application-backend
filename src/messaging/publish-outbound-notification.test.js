import {
  publishDocumentRequestEvent,
  publishStatusChangeEvent
} from './publish-outbound-notification.js'
import { publishMessage, setupClient } from 'ffc-ahwr-common-library'
import { config } from '../config/config.js'

jest.mock('ffc-ahwr-common-library')
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  setBindings: jest.fn()
}

describe('publish outbound notification', () => {
  beforeAll(() => {
    config.set('sns.documentRequestedTopicArn', 'arn:aws:sns:eu-west-2:1:document-requested')
    config.set('sns.statusChangeTopicArn', 'arn:aws:sns:eu-west-2:1:status-change')
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
    })
  })

  describe('publishStatusChangeEvent', () => {
    test('publishes status change event message', async () => {
      const inputMessageBody = {
        sbi: '1234567',
        agreementReference: 'IAHW-RWE2-G8S7',
        claimReference: 'REBC-ABCD-1234',
        claimStatus: 'PAID',
        claimType: 'R',
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
    })
  })
})

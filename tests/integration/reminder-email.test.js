// TODO BH Impl
import { server } from '../../src/server'
import HttpStatus from 'http-status-codes'
import { sendMessage } from '../../src/messaging/send-message.js'

jest.mock('../../src/config/config.js')
// , () => ({
//   config: {
//     notify: {
//       templateIdFarmerEndemicsReviewComplete: ''
//     },
//     reminderEmailRequestMsgType: 'mock.reminder.email.request',
//     applicationRequestQueue: 'mock.queue'
//   }
// }))
jest.mock('../../src/messaging/send-message.js')

describe('reminder-email', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe('POST /api/email/reminder', () => {
    it('should return ACCEPTED status and queue reminder email message when called with empty payload', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/email/reminder',
        payload: {}
      })

      expect(res.statusCode).toBe(HttpStatus.ACCEPTED)
      expect(sendMessage).toHaveBeenCalledWith(
        { requestedDate: expect.any(Date) },
        'mock.reminder.email.request',
        'mock.queue'
      )
    })
  })
})

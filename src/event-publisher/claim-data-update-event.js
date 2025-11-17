import { randomUUID } from 'node:crypto'
import { SEND_SESSION_EVENT } from './index.js'
import { getEventPublisher } from '../messaging/fcp-messaging-service.js'

export const claimDataUpdateEvent = async (
  data,
  type,
  updatedBy,
  updatedAt,
  sbi
) => {
  const event = {
    name: SEND_SESSION_EVENT,
    properties: {
      id: randomUUID(),
      sbi,
      cph: 'n/a',
      checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
      status: 'success',
      action: {
        type: type.replace('application', 'claim'),
        message: `${type.startsWith('application') ? 'Application ' : ''}Claim data updated`,
        data,
        raisedBy: updatedBy,
        raisedOn: updatedAt.toISOString()
      }
    }
  }

  await getEventPublisher().publishEvent(event)
}

import { randomUUID } from 'node:crypto'
import { getFcpEventPublisher } from '../messaging/fcp-messaging-service.js'
import { config } from '../config/config.js'

const serviceName = config.get('serviceName')

export const SEND_SESSION_EVENT = 'send-session-event'
export const APPLICATION_STATUS_EVENT = 'application-status-event'

export const raiseApplicationStatusEvent = async (event) => {
  await getFcpEventPublisher().publishEvent({
    name: SEND_SESSION_EVENT,
    id: `${event.application.id}`,
    sbi: `${event.application.organisation.sbi}`,
    cph: 'n/a',
    checkpoint: serviceName,
    status: 'success',
    type: `application:status-updated:${event.application.status}`,
    message: event.message,
    data: {
      reference: event.application.reference,
      status: event.application.status
    },
    raisedBy: event.raisedBy,
    raisedOn: event.raisedOn.toISOString()
  })
}

export const raiseClaimEvents = async (event, sbi = 'none') => {
  await getFcpEventPublisher().publishEvent({
    name: SEND_SESSION_EVENT,
    id: `${event.claim.id}`,
    sbi,
    cph: 'n/a',
    checkpoint: serviceName,
    status: 'success',
    type: `application:status-updated:${event.claim.status}`,
    message: event.message,
    data: {
      reference: event.claim.reference,
      applicationReference: event.claim.applicationReference,
      status: event.claim.status
    },
    raisedBy: event.raisedBy,
    raisedOn: event.raisedOn.toISOString()
  })
}

export const raiseApplicationFlaggedEvent = async (event, sbi) => {
  await getFcpEventPublisher().publishEvent({
    name: SEND_SESSION_EVENT,
    id: randomUUID(),
    sbi,
    cph: 'n/a',
    checkpoint: serviceName,
    status: 'success',
    type: 'application-flagged',
    message: event.message,
    data: {
      flagId: event.flag.id,
      flagDetail: event.flag.note,
      flagAppliesToMh: event.flag.appliesToMh,
      applicationReference: event.applicationReference
    },
    raisedBy: event.raisedBy,
    raisedOn: event.raisedOn.toISOString()
  })
}

export const raiseApplicationFlagDeletedEvent = async (event, sbi) => {
  await getFcpEventPublisher().publishEvent({
    name: SEND_SESSION_EVENT,
    id: randomUUID(),
    sbi,
    cph: 'n/a',
    checkpoint: serviceName,
    status: 'success',
    type: 'application-flag-deleted',
    message: event.message,
    data: {
      flagId: event.flag.id,
      flagAppliesToMh: event.flag.appliesToMh,
      deletedNote: event.flag.deletedNote,
      applicationReference: event.applicationReference
    },
    raisedBy: event.raisedBy,
    raisedOn: event.raisedOn.toISOString()
  })
}

export const raiseHerdEvent = async ({ sbi, message, data, type }) => {
  await getFcpEventPublisher().publishEvent({
    name: SEND_SESSION_EVENT,
    id: randomUUID(),
    sbi,
    cph: 'n/a',
    checkpoint: serviceName,
    status: 'success',
    type,
    message,
    data,
    raisedBy: 'admin',
    raisedOn: new Date().toISOString()
  })
}

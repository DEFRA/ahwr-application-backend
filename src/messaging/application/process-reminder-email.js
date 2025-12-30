import { randomUUID } from 'node:crypto'
import { config } from '../../config/config.js'
import { reminders as reminderTypes } from 'ffc-ahwr-common-library'
import { getRemindersToSend, updateReminders } from '../../repositories/application-repository.js'
import { isAtLeastMonthsOld } from '../../lib/date-utils.js'
import { getFcpEventPublisher } from '../../messaging/fcp-messaging-service.js'
import { SEND_SESSION_EVENT } from '../../event-publisher/index.js'

const serviceName = config.get('serviceName')

export const processReminderEmailRequest = async (message, db, logger) => {
  const { requestedDate, maxBatchSize } = message

  // TODO setBindings values aren't appearing in CDP logging
  logger.setBindings({ requestedDate })
  logger.info('Processing reminders request started..')

  const applicationsDueReminder = await getApplicationsDueReminderEmail(
    requestedDate,
    maxBatchSize,
    db,
    logger
  )

  if (applicationsDueReminder.length === 0) {
    logger.info('No new applications due reminders')
    return
  }

  for (const application of applicationsDueReminder) {
    const payload = constructMessage(application)
    try {
      await sendToMessageGenerator(payload)
      await sendApplicationSessionEvent(application)
      await saveLastReminderSent(application, db, logger)
    } catch (error) {
      logger.error(error, 'Failed to processed reminders request')
      throw error
    }
  }
  logger.info('Successfully processed reminders request')
}

const getApplicationsDueReminderEmail = async (requestedDate, maxBatchSize, db, logger) => {
  const notClaimedNineMonths = await getApplicationsWithoutClaimAfterNineMonths(
    requestedDate,
    maxBatchSize,
    db,
    logger
  )
  const notClaimedSixMonths = await getApplicationsWithoutClaimAfterSixMonths(
    requestedDate,
    maxBatchSize,
    db,
    logger
  )
  const notClaimedThreeMonths = await getApplicationsWithoutClaimAfterThreeMonths(
    requestedDate,
    maxBatchSize,
    db,
    logger
  )

  const remindersNotClaimed = [
    ...notClaimedNineMonths,
    ...notClaimedSixMonths,
    ...notClaimedThreeMonths
  ]
    .slice(0, maxBatchSize)
    .map(removeOrgEmailIfSameAddressAsEmail)
    .map(promoteToNextReminderIfNoRemindersAndWithinOneMonth)

  return [...remindersNotClaimed]
}

const getApplicationsWithoutClaimAfterNineMonths = async (
  requestedDate,
  maxBatchSize,
  db,
  logger
) => {
  const { nineMonths } = reminderTypes.notClaimed
  const NINE_MONTHS = 9

  const nineMonthReminderWindowStart = new Date(requestedDate)
  nineMonthReminderWindowStart.setUTCMonth(nineMonthReminderWindowStart.getMonth() - NINE_MONTHS)

  return getRemindersToSend(
    nineMonths,
    nineMonthReminderWindowStart,
    undefined,
    [],
    maxBatchSize,
    db,
    logger
  )
}

const getApplicationsWithoutClaimAfterSixMonths = async (
  requestedDate,
  maxBatchSize,
  db,
  logger
) => {
  const { sixMonths, nineMonths } = reminderTypes.notClaimed
  const SIX_MONTHS = 6
  const NINE_MONTHS = 9

  const sixMonthReminderWindowStart = new Date(requestedDate)
  sixMonthReminderWindowStart.setUTCMonth(sixMonthReminderWindowStart.getMonth() - SIX_MONTHS)
  const sixMonthReminderWindowEnd = new Date(requestedDate)
  sixMonthReminderWindowEnd.setUTCMonth(sixMonthReminderWindowEnd.getMonth() - NINE_MONTHS)

  return getRemindersToSend(
    sixMonths,
    sixMonthReminderWindowStart,
    sixMonthReminderWindowEnd,
    [nineMonths],
    maxBatchSize,
    db,
    logger
  )
}

const getApplicationsWithoutClaimAfterThreeMonths = async (
  requestedDate,
  maxBatchSize,
  db,
  logger
) => {
  const { threeMonths, sixMonths, nineMonths } = reminderTypes.notClaimed
  const THREE_MONTHS = 3
  const SIX_MONTHS = 6

  const threeMonthReminderWindowStart = new Date(requestedDate)
  threeMonthReminderWindowStart.setUTCMonth(threeMonthReminderWindowStart.getMonth() - THREE_MONTHS)
  const threeMonthReminderWindowEnd = new Date(requestedDate)
  threeMonthReminderWindowEnd.setUTCMonth(threeMonthReminderWindowEnd.getMonth() - SIX_MONTHS)

  return getRemindersToSend(
    threeMonths,
    threeMonthReminderWindowStart,
    threeMonthReminderWindowEnd,
    [sixMonths, nineMonths],
    maxBatchSize,
    db,
    logger
  )
}

// prevents send two email to same address
const removeOrgEmailIfSameAddressAsEmail = (reminder) => {
  if (reminder.email === reminder.orgEmail) {
    delete reminder.orgEmail
  }
  return reminder
}

// prevents contacting users too often
const promoteToNextReminderIfNoRemindersAndWithinOneMonth = (reminder) => {
  // TODO replace this is condition that checks application history
  if (!reminder.reminders) {
    const FIVE_MONTHS = 5
    const EIGHT_MONTHS = 8
    const { threeMonths, sixMonths, nineMonths } = reminderTypes.notClaimed
    const { reminderType, createdAt } = reminder

    if (reminderType === threeMonths && isAtLeastMonthsOld(createdAt, FIVE_MONTHS)) {
      reminder.reminderType = sixMonths
    } else if (reminderType === sixMonths && isAtLeastMonthsOld(createdAt, EIGHT_MONTHS)) {
      reminder.reminderType = nineMonths
    } else {
      // use existing
    }
  }

  return reminder
}

const constructMessage = ({ reminderType, reference, crn, sbi, email, orgEmail }) => {
  return {
    reminderType,
    agreementReference: reference,
    crn,
    sbi,
    emailAddresses: [email, orgEmail].filter(Boolean) // strip out any undefined
  }
}

const sendToMessageGenerator = async (reminder) => {
  // await sendMessageToSNS(reminderRequestedTopicArn, reminder, {
  //   messageType: messageGeneratorMsgTypeReminder
  // })
}

const sendApplicationSessionEvent = async ({ sbi, reference, reminderType }) => {
  const data = { applicationReference: reference, reminderType }

  // TODO move this to reusable application event fuction, see claim-data-update-event.js
  const event = {
    name: SEND_SESSION_EVENT,
    properties: {
      id: randomUUID(),
      sbi,
      cph: 'n/a',
      checkpoint: serviceName,
      status: 'success',
      action: {
        type: 'application-reminders',
        message: 'Application reminder sent',
        data,
        raisedBy: 'admin',
        raisedOn: new Date().toISOString()
      }
    }
  }

  await getFcpEventPublisher().publishEvent(event)
}

const saveLastReminderSent = async ({ reference, reminderType, reminders }, db, logger) => {
  await updateReminders(reference, reminderType, reminders, db, logger)
}

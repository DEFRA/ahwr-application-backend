import HttpStatus, { StatusCodes } from 'http-status-codes'
import {
  createFlag,
  deleteFlag,
  findApplication
} from '../../../repositories/application-repository.js'
import {
  createOWFlag,
  deleteOWFlag,
  findOWApplication
} from '../../../repositories/ow-application-repository.js'
import { getAllFlags } from '../../../repositories/flag-repository.js'
import { isOWAppRef } from '../../../lib/context-helper.js'
import { randomUUID } from 'node:crypto'
import { raiseApplicationFlagDeletedEvent } from '../../../event-publisher/index.js'

export const deleteFlagHandler = async (request, h) => {
  const { user, deletedNote } = request.payload
  const { flagId } = request.params

  // TODO: find solution using labels perhaps?
  request.logger.setBindings({ flagId, user })

  let updatedApplication = await deleteFlag(request.db, flagId, user, deletedNote)

  if (!updatedApplication) {
    updatedApplication = await deleteOWFlag(request.db, flagId, user, deletedNote)
  }

  if (!updatedApplication) {
    return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
  }

  const deletedFlag = updatedApplication.flags.find((f) => f.id === flagId)

  await raiseApplicationFlagDeletedEvent(
    {
      applicationReference: updatedApplication.applicationReference,
      message: 'Application flag removed',
      flag: {
        id: deletedFlag.id,
        appliesToMh: deletedFlag.appliesToMh,
        deletedNote
      },
      raisedBy: deletedFlag.deletedBy,
      raisedOn: deletedFlag.deletedAt
    },
    updatedApplication.organisation.sbi
  )

  return h.response().code(StatusCodes.NO_CONTENT)
}

export const getAllFlagsHandler = async (request, h) => {
  const flags = await getAllFlags(request.db)

  return h.response(flags).code(StatusCodes.OK)
}

export const createFlagHandler = async (request, h) => {
  const { user, note, appliesToMh } = request.payload
  const { ref } = request.params
  const { db } = request

  request.logger.info(`Create flag ${JSON.stringify({ appliesToMh, user, note, ref })}`)
  const owAppRef = isOWAppRef(ref)

  const application = owAppRef ? await findOWApplication(db, ref) : await findApplication(db, ref)
  if (application === null) {
    return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
  }

  // If the flag already exists then we don't create anything
  const flagExists = application.flags.some(
    (flag) => flag.appliesToMh === appliesToMh && !flag.deleted
  )
  if (flagExists) {
    return h.response().code(HttpStatus.NO_CONTENT)
  }

  const data = {
    id: randomUUID(),
    note,
    createdAt: new Date(),
    createdBy: user,
    appliesToMh,
    deleted: false
  }

  owAppRef ? await createOWFlag(db, ref, data) : await createFlag(db, ref, data)

  // await raiseApplicationFlaggedEvent(
  //   {
  //     application: { id: application.reference },
  //     message: 'Application flagged',
  //     flag: {
  //       id: result.dataValues.id,
  //       note: result.dataValues.note,
  //       appliesToMh: result.dataValues.appliesToMh
  //     },
  //     raisedBy: result.dataValues.createdBy,
  //     raisedOn: result.dataValues.createdAt
  //   },
  //   sbi
  // )

  return h.response().code(HttpStatus.CREATED)
}

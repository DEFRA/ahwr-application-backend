import { randomUUID } from 'node:crypto'

export const buildFlag = ({ note, createdBy, appliesToMh, createdAt = new Date() }) => ({
  id: randomUUID(),
  note,
  createdAt,
  createdBy,
  appliesToMh,
  deleted: false
})

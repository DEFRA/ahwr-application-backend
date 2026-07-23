import Joi from 'joi'
import {
  applicationSearchPayloadSchema,
  claimSearchPayloadSchema
} from './search-payload.schema.js'

describe.each([
  ['applicationSearchPayloadSchema', applicationSearchPayloadSchema],
  ['claimSearchPayloadSchema', claimSearchPayloadSchema]
])('%s', (_name, payloadSchema) => {
  const schema = Joi.object(payloadSchema)

  describe('dateFrom / dateTo range', () => {
    it('accepts dateFrom earlier than dateTo', () => {
      const { error } = schema.validate({
        dateFrom: new Date(2025, 0, 1),
        dateTo: new Date(2025, 0, 2)
      })

      expect(error).toBeUndefined()
    })

    it('accepts dateFrom equal to dateTo', () => {
      const { error } = schema.validate({
        dateFrom: new Date(2025, 0, 1),
        dateTo: new Date(2025, 0, 1)
      })

      expect(error).toBeUndefined()
    })

    it('rejects dateFrom later than dateTo', () => {
      const { error } = schema.validate({
        dateFrom: new Date(2025, 0, 2),
        dateTo: new Date(2025, 0, 1)
      })

      expect(error).toBeDefined()
    })

    it('accepts dateTo on its own', () => {
      const { error } = schema.validate({ dateTo: new Date(2025, 0, 1) })

      expect(error).toBeUndefined()
    })

    it('accepts dateFrom on its own', () => {
      const { error } = schema.validate({ dateFrom: new Date(2025, 0, 1) })

      expect(error).toBeUndefined()
    })
  })

  describe('flag', () => {
    it.each(['ALL', 'FLAGGED', 'NOT_FLAGGED'])('accepts %s', (flag) => {
      const { error } = schema.validate({ flag })

      expect(error).toBeUndefined()
    })

    it('rejects an unknown flag value', () => {
      const { error } = schema.validate({ flag: 'MAYBE' })

      expect(error).toBeDefined()
    })
  })
})

describe('claimSearchPayloadSchema', () => {
  const schema = Joi.object(claimSearchPayloadSchema)

  describe('claimType', () => {
    it.each(['ALL', 'REVIEW', 'FOLLOW_UP'])('accepts %s', (claimType) => {
      const { error } = schema.validate({ claimType })

      expect(error).toBeUndefined()
    })

    it('rejects an unknown claimType value', () => {
      const { error } = schema.validate({ claimType: 'VET_VISIT' })

      expect(error).toBeDefined()
    })
  })
})

import Joi from 'joi'
import { searchPayloadSchema } from './search-payload.schema.js'

describe('searchPayloadSchema', () => {
  const schema = Joi.object(searchPayloadSchema)

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

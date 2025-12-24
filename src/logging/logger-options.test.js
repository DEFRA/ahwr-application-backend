import { loggerOptions } from './logger-options.js'
import { getTraceId } from '@defra/hapi-tracing'

jest.mock('@defra/hapi-tracing')

describe('logger-options', () => {
  it('mixin adds trace id when available', () => {
    getTraceId.mockReturnValueOnce('1234567890')
    const result = loggerOptions.mixin()
    expect(result).toEqual({ trace: { id: '1234567890' } })
  })

  it('mixin adds nothing when trace id not available', () => {
    getTraceId.mockReturnValueOnce(null)
    const result = loggerOptions.mixin()
    expect(result).toEqual({})
  })

  it('formats error object in serializer', () => {
    getTraceId.mockReturnValueOnce(null)
    const result = loggerOptions.serializers.error(new Error('test'))
    expect(result).toEqual({
      message: 'test',
      stack_trace: expect.any(String),
      type: 'Error'
    })
  })

  it('passes through other objects in serializer', () => {
    getTraceId.mockReturnValueOnce(null)
    const untouchedObject = { message: 'test' }
    const result = loggerOptions.serializers.error(untouchedObject)
    expect(result).toEqual(untouchedObject)
  })
})

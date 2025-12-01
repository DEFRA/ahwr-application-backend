import { failAction } from './fail-action.js'

describe('#fail-action', () => {
  test('Should throw expected error a', () => {
    const mockRequest = {}
    const mockToolkit = {}
    const mockError = Error('Something terrible has happened!')

    expect(() => failAction(mockRequest, mockToolkit, mockError)).toThrow(
      'Something terrible has happened!'
    )
  })
})

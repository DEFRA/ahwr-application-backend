import { createApplicationReference, createClaimReference } from './create-reference'

describe('createApplicationReference', () => {
  test('should take an existing TEMP reference and swap the prefix for IAHW', () => {
    expect(createApplicationReference('TEMP-A2SQ-PFNF', 'IAHW')).toEqual('IAHW-A2SQ-PFNF')
  })

  test('should only replace the first instance of TEMP, incase the ID randomly has TEMP inside it', () => {
    expect(createApplicationReference('TEMP-TEMP-TEMP', 'IAHW')).toEqual('IAHW-TEMP-TEMP')
  })

  describe('createClaimReference', () => {
    describe('standard herds', () => {
      test('should throw an error if an incorrect claim type is passed', () => {
        expect(() => createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'Q', 'beef', false)).toThrow()
      })

      test('should throw an error if an incorrect livestock type is passed', () => {
        expect(() =>
          createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'REVIEW', 'beef cattle', false)
        ).toThrow()
      })

      test.each([
        { livestock: 'beef', prefix: 'REBC' },
        { livestock: 'dairy', prefix: 'REDC' },
        { livestock: 'pigs', prefix: 'REPI' },
        { livestock: 'sheep', prefix: 'RESH' }
      ])(
        'should return a proper reference for a $livestock review claim',
        ({ livestock, prefix }) => {
          const result = createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'REVIEW', livestock, false)

          expect(result).toEqual(`${prefix}-A2SQ-PFNF`)
        }
      )

      test.each([
        { livestock: 'beef', prefix: 'FUBC' },
        { livestock: 'dairy', prefix: 'FUDC' },
        { livestock: 'pigs', prefix: 'FUPI' },
        { livestock: 'sheep', prefix: 'FUSH' }
      ])(
        'should return a proper reference for a $livestock endemics claim',
        ({ livestock, prefix }) => {
          const result = createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'FOLLOW_UP', livestock, false)

          expect(result).toEqual(`${prefix}-A2SQ-PFNF`)
        }
      )
    })
    describe('poultry references', () => {
      test('should throw an error if an incorrect claim type is passed', () => {
        expect(() => createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'Q', 'ducks', true)).toThrow()
      })

      test('should throw an error if an incorrect livestock type is passed', () => {
        expect(() => createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'REVIEW', 'beef', true)).toThrow()
      })

      test.each([
        { poultry: 'broilers', reference: 'POBR' },
        { poultry: 'laying', reference: 'POLY' },
        { poultry: 'ducks', reference: 'PODK' },
        { poultry: 'geese', reference: 'POGE' },
        { poultry: 'turkeys', reference: 'POTK' }
      ])(
        'should return proper reference for a $poultry  review claim',
        ({ poultry, reference }) => {
          const result = createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'REVIEW', poultry, true)

          expect(result).toEqual(`${reference}-A2SQ-PFNF`)
        }
      )
    })
  })
})

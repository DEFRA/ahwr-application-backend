import {
  APPLICATION_REFERENCE_PREFIX_OLD_WORLD,
  APPLICATION_REFERENCE_PREFIX_NEW_WORLD,
  APPLICATION_REFERENCE_PREFIX_POULTRY
} from 'ffc-ahwr-common-library'
import { applyAgreementTypeFilter } from './agreement-type-filter.js'

describe('applyAgreementTypeFilter', () => {
  it('restricts reference to the livestock prefixes for IAHW', () => {
    const query = {}

    applyAgreementTypeFilter(query, 'IAHW')

    expect(query).toEqual({
      reference: {
        $regex: `^(${APPLICATION_REFERENCE_PREFIX_OLD_WORLD}|${APPLICATION_REFERENCE_PREFIX_NEW_WORLD})`,
        $options: 'i'
      }
    })
  })

  it('restricts reference to the poultry prefix for PBR', () => {
    const query = {}

    applyAgreementTypeFilter(query, 'PBR')

    expect(query).toEqual({
      reference: { $regex: `^(${APPLICATION_REFERENCE_PREFIX_POULTRY})`, $options: 'i' }
    })
  })

  it('applies the filter to a caller-supplied field', () => {
    const query = {}

    applyAgreementTypeFilter(query, 'PBR', 'applicationReference')

    expect(query).toEqual({
      applicationReference: { $regex: `^(${APPLICATION_REFERENCE_PREFIX_POULTRY})`, $options: 'i' }
    })
  })

  it('does not restrict when agreementType is absent', () => {
    const query = {}

    applyAgreementTypeFilter(query, undefined)

    expect(query).toEqual({})
  })

  it('does not restrict when agreementType is explicitly ALL', () => {
    const query = {}

    applyAgreementTypeFilter(query, 'ALL')

    expect(query).toEqual({})
  })

  it('does not restrict when agreementType is an unknown value', () => {
    const query = {}

    applyAgreementTypeFilter(query, 'NONSENSE')

    expect(query).toEqual({})
  })

  it('leaves an existing field constraint untouched so an exact search takes precedence', () => {
    const query = { applicationReference: 'POUL-8ZPZ-8CLI' }

    applyAgreementTypeFilter(query, 'IAHW', 'applicationReference')

    expect(query).toEqual({ applicationReference: 'POUL-8ZPZ-8CLI' })
  })
})

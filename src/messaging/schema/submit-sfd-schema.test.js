import { validateSFDSchema } from './submit-sfd-schema.js'

describe('validateSFDSchema', () => {
  const validEvent = {
    crn: '1234567890',
    sbi: '123456789',
    agreementReference: 'AGREEMENT-123',
    claimReference: 'CLAIM12345678',
    notifyTemplateId: '550e8400-e29b-41d4-a716-446655440000',
    emailAddress: 'test.user@example.com',
    customParams: {
      foo: 'bar'
    },
    dateTime: new Date().toISOString()
  }

  it('returns true for a valid event', () => {
    const result = validateSFDSchema(validEvent)
    expect(result).toBe(true)
  })

  it('returns false when required fields are missing', () => {
    const invalidEvent = {
      ...validEvent
    }
    delete invalidEvent.sbi

    const result = validateSFDSchema(invalidEvent)
    expect(result).toBe(false)
  })

  it('returns false for an invalid email address', () => {
    const invalidEvent = {
      ...validEvent,
      emailAddress: 'not-an-email'
    }

    const result = validateSFDSchema(invalidEvent)
    expect(result).toBe(false)
  })

  it('returns false for an invalid notifyTemplateId UUID', () => {
    const invalidEvent = {
      ...validEvent,
      notifyTemplateId: 'not-a-uuid'
    }

    const result = validateSFDSchema(invalidEvent)
    expect(result).toBe(false)
  })

  it('returns false when sbi is not 9 digits', () => {
    const invalidEvent = {
      ...validEvent,
      sbi: '12345'
    }

    const result = validateSFDSchema(invalidEvent)
    expect(result).toBe(false)
  })

  it('returns false when crn is not 10 digits', () => {
    const invalidEvent = {
      ...validEvent,
      crn: '12345'
    }

    const result = validateSFDSchema(invalidEvent)
    expect(result).toBe(false)
  })

  it('returns false when claimReference exceeds max length', () => {
    const invalidEvent = {
      ...validEvent,
      claimReference: 'A'.repeat(15) // MAX_CLAIM_REF_LENGTH + 1
    }

    const result = validateSFDSchema(invalidEvent)
    expect(result).toBe(false)
  })

  it('returns false when agreementReference is missing', () => {
    const invalidEvent = {
      ...validEvent
    }
    delete invalidEvent.agreementReference

    const result = validateSFDSchema(invalidEvent)
    expect(result).toBe(false)
  })

  it('returns false when customParams is missing', () => {
    const invalidEvent = {
      ...validEvent
    }
    delete invalidEvent.customParams

    const result = validateSFDSchema(invalidEvent)
    expect(result).toBe(false)
  })

  it('returns false when dateTime is missing', () => {
    const invalidEvent = {
      ...validEvent
    }
    delete invalidEvent.dateTime

    const result = validateSFDSchema(invalidEvent)
    expect(result).toBe(false)
  })
})

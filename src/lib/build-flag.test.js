import { buildFlag } from './build-flag'

describe('buildFlag', () => {
  test('builds a flag with a generated id and deleted set to false', () => {
    const createdAt = new Date('2026-01-01T09:00:00.000Z')

    const flag = buildFlag({
      note: 'Flag added due to withdrawn claim',
      createdBy: 'admin',
      appliesToMh: false,
      createdAt
    })

    expect(flag).toEqual({
      id: expect.any(String),
      note: 'Flag added due to withdrawn claim',
      createdBy: 'admin',
      appliesToMh: false,
      createdAt,
      deleted: false
    })
  })

  test('defaults createdAt to the current time when not provided', () => {
    const flag = buildFlag({ note: 'a note', createdBy: 'admin', appliesToMh: true })

    expect(flag.createdAt).toBeInstanceOf(Date)
  })

  test('generates a unique id for each flag', () => {
    const args = { note: 'a note', createdBy: 'admin', appliesToMh: true }

    expect(buildFlag(args).id).not.toEqual(buildFlag(args).id)
  })
})

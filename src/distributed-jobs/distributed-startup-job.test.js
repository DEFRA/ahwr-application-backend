import { runDistributedStartupJob } from './distributed-startup-job.js'

jest.mock('./data-changes/process_changes.js')

const mockDB = { collection: jest.fn(() => mockCollection) }
const mockCollection = { insertOne: jest.fn(() => {}) }
const mockLogger = { info: jest.fn() }

describe('Test runDistributedStartupJob', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not run job when cdpEnvironment is not local|dev|prod', async () => {
    await runDistributedStartupJob(mockDB, mockLogger, {
      environment: 'not-run-env',
      dataChanges: null
    })

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when supporting data is null', async () => {
    await runDistributedStartupJob(mockDB, mockLogger, {
      environment: 'local',
      dataChanges: null
    })

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when supporting data is undefined', async () => {
    await runDistributedStartupJob(mockDB, mockLogger, {
      environment: 'local',
      dataChanges: undefined
    })

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when there is no data', async () => {
    await runDistributedStartupJob(mockDB, mockLogger, {
      environment: 'local',
      dataChanges: {}
    })

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when already been run', async () => {
    mockCollection.insertOne.mockRejectedValueOnce('job already been run')

    await runDistributedStartupJob(mockDB, mockLogger, {
      environment: 'local',
      dataChanges: {
        version: '1',
        data: [{ claimRef: 'test', sbi: '123', applicationRef: 'app', action: 'deletion' }]
      }
    })

    expect(mockDB.collection).toHaveBeenCalled()
    expect(mockCollection.insertOne).toHaveBeenCalled()
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it('should not run job when data field returns null', async () => {
    await expect(
      runDistributedStartupJob(mockDB, mockLogger, {
        environment: 'local',
        dataChanges: { version: '123', data: null }
      })
    ).rejects.toThrow('Missing data field for data change version 123')

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when data field is default/empty', async () => {
    await expect(
      runDistributedStartupJob(mockDB, mockLogger, {
        environment: 'local',
        dataChanges: { version: '123', data: [] }
      })
    ).rejects.toThrow('Missing data field for data change version 123')

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job  when data field is not an array', async () => {
    await expect(
      runDistributedStartupJob(mockDB, mockLogger, {
        environment: 'local',
        dataChanges: { version: '123', data: {} }
      })
    ).rejects.toThrow('Missing data field for data change version 123')

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when version field is not present', async () => {
    await expect(
      runDistributedStartupJob(mockDB, mockLogger, {
        environment: 'local',
        dataChanges: {
          data: [{ claimRef: 'test', sbi: '123', applicationRef: 'app', action: 'deletion' }]
        }
      })
    ).rejects.toThrow('There is no version of the data')

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when version field is empty string', async () => {
    await expect(
      runDistributedStartupJob(mockDB, mockLogger, {
        environment: 'local',
        dataChanges: {
          version: '',
          data: [{ claimRef: 'test', sbi: '123', applicationRef: 'app', action: 'deletion' }]
        }
      })
    ).rejects.toThrow('There is no version of the data')

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should run job and executes data changes', async () => {
    await runDistributedStartupJob(mockDB, mockLogger, {
      environment: 'local',
      dataChanges: {
        version: '1',
        data: [{ claimRef: 'test', sbi: '123', applicationRef: 'app', action: 'deletion' }]
      }
    })

    expect(mockDB.collection).toHaveBeenCalledWith('distributed-job-locks')
    expect(mockCollection.insertOne).toHaveBeenCalledWith({
      _id: '1',
      environments: ['local', 'dev', 'prod'],
      lockedAt: expect.any(Date),
      type: 'startup'
    })
  })
})

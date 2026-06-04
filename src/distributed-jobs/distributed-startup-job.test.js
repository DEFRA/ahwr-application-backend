import {
  runDistributedStartupJob,
  runDistributedStartupJobInBackground
} from './distributed-startup-job.js'
import { config } from '../config/config.js'

jest.mock('../config/config.js')
jest.mock('./data-changes/process_changes.js')

const mockDB = { collection: jest.fn(() => mockCollection) }
const mockCollection = { insertOne: jest.fn(() => {}) }
const mockChildLogger = { info: jest.fn() }
const mockLogger = { info: jest.fn(), error: jest.fn(), child: jest.fn(() => mockChildLogger) }

describe('runDistributedStartupJob', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not run job when cdpEnvironment is not local|dev|prod', async () => {
    await runDistributedStartupJob(mockDB, mockLogger, {
      environment: 'not-run-env',
      dataChanges: null
    })

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('does not run job when supporting data is null', async () => {
    await runDistributedStartupJob(mockDB, mockLogger, {
      environment: 'local',
      dataChanges: null
    })

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('does not run job when supporting data is undefined', async () => {
    await runDistributedStartupJob(mockDB, mockLogger, {
      environment: 'local',
      dataChanges: undefined
    })

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('does not run job when there is no data', async () => {
    await runDistributedStartupJob(mockDB, mockLogger, {
      environment: 'local',
      dataChanges: {}
    })

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('does not run job when already been run', async () => {
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

  it('does not run job when data field returns null', async () => {
    await expect(
      runDistributedStartupJob(mockDB, mockLogger, {
        environment: 'local',
        dataChanges: { version: '123', data: null }
      })
    ).rejects.toThrow('Missing data field for data change version 123')

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('does not run job when data field is default/empty', async () => {
    await expect(
      runDistributedStartupJob(mockDB, mockLogger, {
        environment: 'local',
        dataChanges: { version: '123', data: [] }
      })
    ).rejects.toThrow('Missing data field for data change version 123')

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('does not run job  when data field is not an array', async () => {
    await expect(
      runDistributedStartupJob(mockDB, mockLogger, {
        environment: 'local',
        dataChanges: { version: '123', data: {} }
      })
    ).rejects.toThrow('Missing data field for data change version 123')

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('does not run job when version field is not present', async () => {
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

  it('does not run job when version field is empty string', async () => {
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

  it('runs job and executes data changes', async () => {
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

describe('runDistributedStartupJobInBackground', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reads config and passes values to runDistributedStartupJob', async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        'distributedJobs.supportingData': {
          version: '1',
          data: [{ claimRef: 'test', sbi: '123', applicationRef: 'app', action: 'deletion' }]
        }
      }
      return values[key]
    })

    await runDistributedStartupJobInBackground(mockDB, mockLogger)

    expect(config.get).toHaveBeenCalledWith('cdpEnvironment')
    expect(config.get).toHaveBeenCalledWith('distributedJobs.supportingData')
    expect(mockLogger.child).toHaveBeenCalled()
    expect(mockDB.collection).toHaveBeenCalledWith('distributed-job-locks')
  })

  it('logs error when job throws', async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        'distributedJobs.supportingData': {
          data: [{ claimRef: 'test', sbi: '123', applicationRef: 'app', action: 'deletion' }]
        }
      }
      return values[key]
    })

    await runDistributedStartupJobInBackground(mockDB, mockLogger)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'There is no version of the data' }),
      'Distributed startup job error'
    )
  })

  it('does not throw when job fails', async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        'distributedJobs.supportingData': { version: '1', data: null }
      }
      return values[key]
    })

    await expect(runDistributedStartupJobInBackground(mockDB, mockLogger)).resolves.not.toThrow()
  })
})

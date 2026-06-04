import { runDistributedStartupJob } from './distributed-startup-job.js'
import { config } from '../config/config.js'

jest.mock('../config/config.js')
jest.mock('./data-changes/process_changes.js')

const mockDB = { collection: jest.fn(() => mockCollection) }
const mockCollection = { insertOne: jest.fn(() => {}) }
const mockLogger = { info: jest.fn() }

describe('Test runDistributedStartupJob', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not run job when cdpEnvironment is not local|dev|prod', async () => {
    config.get.mockImplementationOnce(() => 'not-run-env')

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when supporting data is null', async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        'distributedJobs.supportingData': null
      }
      return values[key]
    })

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when supporting data is undefined', async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        'distributedJobs.supportingData': undefined
      }
      return values[key]
    })

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when supporting data not present', async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local'
      }
      return values[key]
    })

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when there is no data', async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        'distributedJobs.supportingData': {}
      }
      return values[key]
    })

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when supporting data is default/empty', async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        'distributedJobs.supportingData': { version: '1', data: [] }
      }
      return values[key]
    })

    await expect(runDistributedStartupJob(mockDB, mockLogger)).rejects.toThrow(
      `Missing supporting data for data change version 1`
    )
  })

  it('should not run job when already been run', async () => {
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
    mockCollection.insertOne.mockRejectedValueOnce('job already been run')

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).toHaveBeenCalled()
    expect(mockCollection.insertOne).toHaveBeenCalled()
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it('should throw when supporting data config returns null', async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        'distributedJobs.supportingData': { version: '123', data: null }
      }
      return values[key]
    })

    await expect(runDistributedStartupJob(mockDB, mockLogger)).rejects.toThrow(
      `Missing supporting data for data change version 123`
    )
  })

  it('should not run job if supporting version is not present', async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        'distributedJobs.supportingData': {
          data: [{ claimRef: 'test', sbi: '123', applicationRef: 'app', action: 'deletion' }]
        }
      }
      return values[key]
    })

    await expect(runDistributedStartupJob(mockDB, mockLogger)).rejects.toThrow(
      'There is no version of the data'
    )
  })

  it('should not run job if supporting version is empty string', async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        'distributedJobs.supportingData': {
          version: '',
          data: [{ claimRef: 'test', sbi: '123', applicationRef: 'app', action: 'deletion' }]
        }
      }
      return values[key]
    })

    await expect(runDistributedStartupJob(mockDB, mockLogger)).rejects.toThrow(
      'There is no version of the data'
    )
  })

  it('should run job and executes data changes', async () => {
    const supportingDataVersion = `supportingData`
    const supportingDataConfigKey = `distributedJobs.${supportingDataVersion}`

    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        [supportingDataConfigKey]: {
          version: '1',
          data: [{ claimRef: 'test', sbi: '123', applicationRef: 'app', action: 'deletion' }]
        }
      }
      return values[key]
    })

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).toHaveBeenCalledWith('distributed-job-locks')
    expect(mockCollection.insertOne).toHaveBeenCalledWith({
      _id: '1',
      environments: ['local', 'dev', 'prod'],
      lockedAt: expect.any(Date),
      type: 'startup'
    })
  })
})

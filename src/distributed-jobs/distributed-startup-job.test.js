import { runDistributedStartupJob } from './distributed-startup-job.js'
import { config } from '../config/config.js'

jest.mock('../config/config.js')
jest.mock('./data-changes/v0721-data-changes.js')

const mockDB = { collection: jest.fn(() => mockCollection) }
const mockCollection = { insertOne: jest.fn(() => {}) }
const mockLogger = { info: jest.fn() }

describe('Test runDistributedStartupJob', () => {
  it('should not run job when cdpEnvironment is not local|dev|prod', async () => {
    config.get.mockImplementationOnce(() => 'not-run-env')

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when service version is not present', async () => {
    config.getProperties.mockReturnValue({ distributedJobs: {} })
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        serviceVersion: null,
        'distributedJobs.vnullSupportingData': {}
      }
      return values[key]
    })

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when supporting data is default/empty', async () => {
    config.getProperties.mockReturnValue({ distributedJobs: { v0690SupportingData: {} } })
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        serviceVersion: '0.69.0',
        'distributedJobs.v0690SupportingData': {}
      }
      return values[key]
    })

    await expect(runDistributedStartupJob(mockDB, mockLogger)).rejects.toThrow(
      'Missing supporting data for service version 0.69.0'
    )
  })

  it('should not run job when already been run', async () => {
    config.getProperties.mockReturnValue({ distributedJobs: { v0690SupportingData: {} } })
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        serviceVersion: '0.69.0',
        'distributedJobs.v0690SupportingData': {
          mandatory: 'need-at-least-one-key-to-be-valid-data'
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

  it('should run job but exit early when config not present', async () => {
    config.getProperties.mockReturnValue({ distributedJobs: {} })
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        serviceVersion: '0.69.0'
      }
      return values[key]
    })

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).toHaveBeenCalled()
    expect(mockCollection.insertOne).toHaveBeenCalled()
  })

  it('should run job if config present but no data changes for service version', async () => {
    config.getProperties.mockReturnValue({ distributedJobs: { v000SupportingData: {} } })
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        serviceVersion: '0.0.0',
        'distributedJobs.v000SupportingData': {
          mandatory: 'need-at-least-one-key-to-be-valid-data'
        }
      }
      return values[key]
    })

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).toHaveBeenCalled()
    expect(mockCollection.insertOne).toHaveBeenCalled()
  })

  // This test should change from data change to data change, don't forget to mock vXXXX-data-changes.js
  it('should run job and executes data changes', async () => {
    const serviceVersion = '0.72.1'
    const supportingDataVersion = `v${serviceVersion.replaceAll('.', '')}SupportingData`
    const supportingDataConfigKey = `distributedJobs.${supportingDataVersion}`

    config.getProperties.mockReturnValue({ distributedJobs: { [supportingDataVersion]: {} } })
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        serviceVersion,
        [supportingDataConfigKey]: {
          mandatory: 'need-at-least-one-key-to-be-valid-data'
        }
      }
      return values[key]
    })

    await runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).toHaveBeenCalledWith('distributed-job-locks')
    expect(mockCollection.insertOne).toHaveBeenCalledWith({
      _id: serviceVersion,
      environments: ['local', 'dev', 'prod'],
      lockedAt: expect.any(Date),
      type: 'startup'
    })
  })
})

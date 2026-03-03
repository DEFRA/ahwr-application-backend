import { runDistributedStartupJob } from './distributed-startup-job.js'
import { config } from '../config/config.js'

jest.mock('../config/config.js')
jest.mock('./data-changes/v0690-data-changes.js')
// add mocks for each set of data change here

const mockDB = { collection: jest.fn(() => mockCollection) }
const mockCollection = { insertOne: jest.fn(() => {}) }
const mockLogger = { info: jest.fn() }

describe('Test runDistributedStartupJob', () => {
  it('should not run job when cdpEnvironment is not local|dev|prod', () => {
    config.get.mockImplementationOnce(() => 'not-run-env')

    runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when supporting data is missing', () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        serviceVersion: '0.69.0',
        'distributedJobs.v0690SupportingData': {}
      }
      return values[key]
    })

    expect(() => runDistributedStartupJob(mockDB, mockLogger)).rejects.toThrow(
      'Missing supporting data for service version 0.69.0'
    )
  })

  it('should not run job when already been run', () => {
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

    runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).toHaveBeenCalled()
    expect(mockCollection.insertOne).toHaveBeenCalled()
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it('should run job but no data changes for service version', () => {
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

    runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).toHaveBeenCalled()
    expect(mockCollection.insertOne).toHaveBeenCalled()
  })

  it('should run job and executes data changes', () => {
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

    runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).toHaveBeenCalledWith('distributed-job-locks')
    expect(mockCollection.insertOne).toHaveBeenCalledWith({
      _id: '0.69.0',
      environments: ['local', 'dev', 'prod'],
      lockedAt: expect.any(Date),
      type: 'startup'
    })
  })
})

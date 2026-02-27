import { runDistributedStartupJob } from './distributed-startup-job.js'
import { config } from '../config/config.js'
import { v0680DatastoreUpdates, v0680SendEvents } from './data-changes/v0680-data-changes.js'

jest.mock('../config/config.js')
jest.mock('./data-changes/v0680-data-changes.js')

const mockDB = { collection: jest.fn(() => mockCollection) }
const mockCollection = { insertOne: jest.fn(() => {}) }
const mockLogger = { info: jest.fn() }

describe('Test runDistributedStartupJob', () => {
  beforeEach(async () => {
    config.get.mockImplementation((key) => {
      const values = {
        cdpEnvironment: 'local',
        serviceVersion: '0.68.0',
        distributedJobs: {
          v0680SupportingData: {}
        }
      }
      return values[key]
    })
  })

  it('should not run job when cdpEnvironment is not local|dev|prod', () => {
    config.get.mockImplementationOnce(() => 'not-run-env')

    runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).not.toHaveBeenCalled()
    expect(mockCollection.insertOne).not.toHaveBeenCalled()
  })

  it('should not run job when already been run', () => {
    mockCollection.insertOne.mockRejectedValueOnce('job already been run')

    runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).toHaveBeenCalled()
    expect(mockCollection.insertOne).toHaveBeenCalled()
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it('should run job but no data changes for service version', () => {
    config.get.mockImplementationOnce((key) => {
      const values = {
        cdpEnvironment: 'local',
        serviceVersion: '0.0.0',
        distributedJobs: {
          v0680SupportingData: {}
        }
      }
      return values[key]
    })

    runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).toHaveBeenCalled()
    expect(mockCollection.insertOne).toHaveBeenCalled()
    expect(v0680DatastoreUpdates).not.toHaveBeenCalled()
    expect(v0680SendEvents).not.toHaveBeenCalled()
  })

  // job runs and executes data changes
  it('should run job and executes data changes', () => {
    runDistributedStartupJob(mockDB, mockLogger)

    expect(mockDB.collection).toHaveBeenCalledWith('distributed-job-locks')
    expect(mockCollection.insertOne).toHaveBeenCalledWith({
      _id: '0.68.0',
      environments: ['local', 'dev', 'prod'],
      lockedAt: expect.any(Date),
      type: 'startup'
    })
    expect(v0680DatastoreUpdates).toHaveBeenCalled()
    expect(v0680SendEvents).toHaveBeenCalled()
  })
})

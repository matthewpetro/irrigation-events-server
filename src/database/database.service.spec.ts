import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { DatabaseService } from './database.service'

// Mock the Nano library
const mockAuth = jest.fn()
const mockUse = jest.fn()
jest.mock('nano', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    auth: mockAuth,
    db: {
      use: mockUse,
    },
  })),
}))

describe('DatabaseService', () => {
  let service: DatabaseService
  let testingModule: TestingModule

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ envFilePath: '.env.testing' })],
      providers: [DatabaseService],
    }).compile()

    await testingModule.init()
    testingModule.enableShutdownHooks()
    service = testingModule.get<DatabaseService>(DatabaseService)
  })

  afterEach(async () => {
    await testingModule.close()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('the auth function should have been called', () => {
    expect(mockAuth).toHaveBeenCalled()
  })

  it('the db.use function should have been called', () => {
    service.getDatabaseConnection('testDb')
    expect(mockUse).toHaveBeenCalledWith('testDb')
  })
})

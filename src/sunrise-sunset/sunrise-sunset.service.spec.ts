import { Test, TestingModule } from '@nestjs/testing'
import { SunriseSunsetService } from './sunrise-sunset.service'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '@/database/database.module'
import axios from 'axios'

// Mock the Nano library
const mockInsert = jest.fn()
const mockFind = jest.fn()
jest.mock('nano', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        auth: jest.fn(),
        db: {
          use: jest.fn().mockReturnValue({
            find: mockFind,
            insert: mockInsert,
          }),
        },
      }
    }),
  }
})

jest.mock('axios')
const mockGet = jest.fn()
axios.create = jest.fn().mockReturnValue({
  get: mockGet,
})

describe('SunriseSunsetService', () => {
  let service: SunriseSunsetService
  let testingModule: TestingModule

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      providers: [SunriseSunsetService],
      imports: [ConfigModule.forRoot({ envFilePath: '.env.testing' }), DatabaseModule],
    }).compile()

    await testingModule.init()
    testingModule.enableShutdownHooks()
    service = testingModule.get<SunriseSunsetService>(SunriseSunsetService)
  })

  afterEach(async () => {
    await testingModule.close()
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

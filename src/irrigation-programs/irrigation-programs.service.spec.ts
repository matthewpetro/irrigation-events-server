import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationProgramsService } from './irrigation-programs.service'
import { DatabaseModule } from '@/database/database.module'
import { ConfigModule } from '@nestjs/config'

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

describe('IrrigationProgramsService', () => {
  let service: IrrigationProgramsService
  let testingModule: TestingModule

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      providers: [IrrigationProgramsService],
      imports: [ConfigModule.forRoot({ envFilePath: '.env.testing' }), DatabaseModule],
    }).compile()

    await testingModule.init()
    testingModule.enableShutdownHooks()
    service = testingModule.get<IrrigationProgramsService>(IrrigationProgramsService)
  })

  afterEach(async () => {
    await testingModule.close()
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create an irrigation program', async () => {
    const irrigationProgram = await service.create({
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousIrrigation: true,
    })
    expect(irrigationProgram).toBeDefined()
  })
})

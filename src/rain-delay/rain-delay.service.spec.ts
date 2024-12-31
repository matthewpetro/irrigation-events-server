import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { DocumentInsertResponse } from 'nano'
import { HttpException } from '@nestjs/common'
import { RainDelayService } from '@/rain-delay/rain-delay.service'
import { DatabaseModule } from '@/database/database.module'

// Mock the Nano library
const mockDestroy = jest.fn()
const mockFind = jest.fn()
const mockGet = jest.fn()
const mockHead = jest.fn()
const mockInsert = jest.fn()
const mockList = jest.fn()
jest.mock('nano', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    auth: jest.fn(),
    db: {
      use: jest.fn().mockReturnValue({
        destroy: mockDestroy,
        find: mockFind,
        get: mockGet,
        head: mockHead,
        insert: mockInsert,
        list: mockList,
      }),
    },
  })),
}))

describe('RainDelayService', () => {
  let service: RainDelayService
  let testingModule: TestingModule

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      providers: [RainDelayService],
      imports: [ConfigModule.forRoot({ envFilePath: '.env.testing' }), DatabaseModule],
    }).compile()

    await testingModule.init()
    testingModule.enableShutdownHooks()
    service = testingModule.get<RainDelayService>(RainDelayService)
  })

  afterEach(async () => {
    await testingModule.close()
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should get the end date of the rain delay', async () => {
    const mockResumeWateringAfterDate = '2024-01-01'
    mockGet.mockResolvedValue({ resumeWateringAfterDate: mockResumeWateringAfterDate })
    const result = await service.get()
    expect(result).toEqual(mockResumeWateringAfterDate)
  })

  it('should get a null if no rain delay is set', async () => {
    mockGet.mockResolvedValue({ resumeWateringAfterDate: null })
    const result = await service.get()
    expect(result).toBeNull()
  })

  it('should throw an HttpException if the get fails', async () => {
    mockGet.mockRejectedValue(new Error())
    await expect(service.get()).rejects.toThrow(HttpException)
  })

  it('should update the rain delay', async () => {
    const mockResumeWateringAfterDate = '2024-01-01'
    mockInsert.mockResolvedValue({ ok: true } as DocumentInsertResponse)
    await service.update({ resumeWateringAfterDate: mockResumeWateringAfterDate })
    expect(mockInsert).toHaveBeenCalledWith({ resumeWateringAfterDate: mockResumeWateringAfterDate }, 'rain-delay')
  })

  it('should throw an HttpException if the update fails', async () => {
    const mockResumeWateringAfterDate = '2024-01-01'
    mockInsert.mockRejectedValue(new Error())
    await expect(service.update({ resumeWateringAfterDate: mockResumeWateringAfterDate })).rejects.toThrow(HttpException)
  })

  it('should remove the rain delay', async () => {
    mockInsert.mockResolvedValue({ ok: true } as DocumentInsertResponse)
    await service.remove()
    expect(mockInsert).toHaveBeenCalledWith({ resumeWateringAfterDate: null }, 'rain-delay')
  })

  it('should throw an HttpException if the remove fails', async () => {
    mockInsert.mockRejectedValue(new Error())
    await expect(service.remove()).rejects.toThrow(HttpException)
  })
})

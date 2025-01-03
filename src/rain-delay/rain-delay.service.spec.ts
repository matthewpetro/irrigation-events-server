import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { HttpException } from '@nestjs/common'
import { RainDelayService } from '@/rain-delay/rain-delay.service'
import { DatabaseModule } from '@/database/database.module'

// Mock the Nano library
const mockGet = jest.fn()
const mockInsert = jest.fn()
jest.mock('nano', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    auth: jest.fn(),
    db: {
      use: jest.fn().mockReturnValue({
        get: mockGet,
        insert: mockInsert,
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

  describe('get rain delay tests', () => {
    it('should get the end date of the rain delay', async () => {
      const mockResumeWateringAfterDate = '2024-01-01'
      mockGet.mockResolvedValue({ resumeWateringAfterDate: mockResumeWateringAfterDate })
      const result = await service.get()
      expect(result.resumeWateringAfterDate).toEqual(mockResumeWateringAfterDate)
    })

    it('should insert a new document when no rain delay is set', async () => {
      mockGet.mockRejectedValue(new Error())
      const result = await service.get()
      expect(mockInsert).toHaveBeenCalledWith({ resumeWateringAfterDate: null }, 'rain-delay')
      expect(result.resumeWateringAfterDate).toBeNull()
    })

    it('should throw an HttpException if the get and insert both fail', async () => {
      mockGet.mockRejectedValue(new Error())
      mockInsert.mockRejectedValue(new Error())
      await expect(service.get()).rejects.toThrow(HttpException)
    })
  })

  describe('update rain delay tests', () => {
    it('should update the rain delay', async () => {
      const mockResumeWateringAfterDate = '2024-01-02'
      mockGet.mockResolvedValue({ resumeWateringAfterDate: null, _rev: '1-234' })
      mockInsert.mockResolvedValue(null)
      await service.update({ resumeWateringAfterDate: mockResumeWateringAfterDate })
      expect(mockInsert).toHaveBeenCalledWith(
        { resumeWateringAfterDate: mockResumeWateringAfterDate, _rev: '1-234' },
        'rain-delay'
      )
    })

    it('should insert a new document when no rain delay is set', async () => {
      const mockResumeWateringAfterDate = '2024-01-02'
      mockGet.mockRejectedValue(new Error())
      mockInsert.mockResolvedValue(null)
      await service.update({ resumeWateringAfterDate: mockResumeWateringAfterDate })
      expect(mockInsert).toHaveBeenCalledWith({ resumeWateringAfterDate: mockResumeWateringAfterDate }, 'rain-delay')
    })

    it('should throw an HttpException if the get and insert both fail', async () => {
      const mockResumeWateringAfterDate = '2024-01-02'
      mockGet.mockRejectedValue(new Error())
      mockInsert.mockRejectedValue(new Error())
      await expect(service.update({ resumeWateringAfterDate: mockResumeWateringAfterDate })).rejects.toThrow(
        HttpException
      )
    })
  })
})

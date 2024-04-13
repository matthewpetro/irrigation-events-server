import { Test, TestingModule } from '@nestjs/testing'
import { SunriseSunsetService } from './sunrise-sunset.service'
import { ConfigModule } from '@nestjs/config'
import axios, { AxiosRequestConfig } from 'axios'
import { DatabaseModule } from '@/database/database.module'
import {
  mockStartDate,
  mockEndDate,
  mockApiResponses,
  mockEntities,
  mockSunriseSunsets,
} from './mocks/sunrise-sunset.mocks'

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

  it('should get all sunrise/sunset data from the database', async () => {
    mockFind.mockResolvedValue({ docs: mockEntities })
    const result = await service.getSunriseSunsets(mockStartDate, mockEndDate)
    expect(mockFind).toHaveBeenCalled()
    expect(mockGet).not.toHaveBeenCalled()
    expect(result).toEqual(mockSunriseSunsets)
  })

  it('should get all sunrise/sunset data from the API', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    mockGet.mockImplementation((url: string, config: AxiosRequestConfig) =>
      Promise.resolve({ data: mockApiResponses[config.params.date] })
    )
    const result = await service.getSunriseSunsets(mockStartDate, mockEndDate)
    expect(mockFind).toHaveBeenCalled()
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-01' } })
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-02' } })
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-03' } })
    expect(result).toEqual(mockSunriseSunsets)
  })

  it('should get all sunrise/sunset data from the API if the database throws an error', async () => {
    mockFind.mockRejectedValue(new Error('Database error'))
    mockGet.mockImplementation((url: string, config: AxiosRequestConfig) =>
      Promise.resolve({ data: mockApiResponses[config.params.date] })
    )
    const result = await service.getSunriseSunsets(mockStartDate, mockEndDate)
    expect(mockFind).toHaveBeenCalled()
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-01' } })
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-02' } })
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-03' } })
    expect(result).toEqual(mockSunriseSunsets)
  })

  it('should return an empty map if data cannot be retrieved from the database or API', async () => {
    mockFind.mockRejectedValue(new Error('Database error'))
    mockGet.mockRejectedValue(new Error('API error'))
    const result = await service.getSunriseSunsets(mockStartDate, mockEndDate)
    expect(mockFind).toHaveBeenCalled()
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-01' } })
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-02' } })
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-03' } })
    expect(result.size).toEqual(0)
  })

  it('should get sunrise/sunset data from the API and database', async () => {
    mockFind.mockResolvedValue({
      docs: [mockEntities.find((entity) => entity._id === '2024-01-01')],
    })
    mockGet.mockImplementation((url: string, config: AxiosRequestConfig) =>
      Promise.resolve({ data: mockApiResponses[config.params.date] })
    )
    const result = await service.getSunriseSunsets(mockStartDate, mockEndDate)
    expect(mockFind).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalledWith(mockEntities.find((entity) => entity._id === '2024-01-02'))
    expect(mockInsert).toHaveBeenCalledWith(mockEntities.find((entity) => entity._id === '2024-01-03'))
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-02' } })
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-03' } })
    expect(result).toEqual(mockSunriseSunsets)
  })

  it('should get one sunrise/sunset data from the database', async () => {
    mockFind.mockResolvedValue({ docs: mockEntities })
    const result = await service.getSunriseSunset(mockStartDate)
    expect(mockFind).toHaveBeenCalled()
    expect(mockGet).not.toHaveBeenCalled()
    expect(result).toEqual(mockSunriseSunsets.get('2024-01-01'))
  })

  it('should get one sunrise/sunset from the API and store it in the database', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    mockGet.mockImplementation((url: string, config: AxiosRequestConfig) =>
      Promise.resolve({ data: mockApiResponses[config.params.date] })
    )
    const result = await service.getSunriseSunset(mockStartDate)
    expect(mockFind).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalledWith(mockEntities.find((entity) => entity._id === '2024-01-01'))
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-01' } })
    expect(result).toEqual(mockSunriseSunsets.get('2024-01-01'))
  })
})

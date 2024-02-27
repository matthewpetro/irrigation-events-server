import { Test, TestingModule } from '@nestjs/testing'
import { SunriseSunsetService } from './sunrise-sunset.service'
import { ConfigModule } from '@nestjs/config'
import axios, { AxiosRequestConfig } from 'axios'
import { format, parseISO } from 'date-fns'
import { DatabaseModule } from '@/database/database.module'
import { SunriseSunsetDocument } from './entities/sunrise-sunset.entity'
import type { SunriseSunsets } from './interfaces/sunrise-sunset.interface'

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
    const mockDbDocs: SunriseSunsetDocument[] = [
      { _id: '2024-01-01', sunrise: '2024-01-01T07:00:00-07:00', sunset: '2024-01-01T19:00:00-07:00' },
      { _id: '2024-01-02', sunrise: '2024-01-02T07:01:00-07:00', sunset: '2024-01-02T19:00:01-07:00' },
      { _id: '2024-01-03', sunrise: '2024-01-03T07:02:00-07:00', sunset: '2024-01-03T19:00:02-07:00' },
    ]
    const mockResponse: SunriseSunsets = new Map([
      ['2024-01-01', { sunrise: '2024-01-01T07:00:00-07:00', sunset: '2024-01-01T19:00:00-07:00' }],
      ['2024-01-02', { sunrise: '2024-01-02T07:01:00-07:00', sunset: '2024-01-02T19:00:01-07:00' }],
      ['2024-01-03', { sunrise: '2024-01-03T07:02:00-07:00', sunset: '2024-01-03T19:00:02-07:00' }],
    ])
    const mockStartDate = parseISO('2024-01-01')
    const mockEndDate = parseISO('2024-01-03')
    mockFind.mockResolvedValue({ docs: mockDbDocs })
    const result = await service.getSunriseSunsets(mockStartDate, mockEndDate)
    expect(mockFind).toHaveBeenCalledWith({
      selector: {
        $and: [
          {
            _id: {
              $gte: format(mockStartDate, 'yyyy-MM-dd'),
            },
          },
          {
            _id: {
              $lte: format(mockEndDate, 'yyyy-MM-dd'),
            },
          },
        ],
      },
      sort: [{ _id: 'asc' }],
      limit: 10000,
    })
    expect(mockGet).not.toHaveBeenCalled()
    expect(result).toEqual(mockResponse)
  })

  it('should get sunrise/sunset data from the API and database', async () => {
    const mockDbDocs: SunriseSunsetDocument[] = [
      { _id: '2024-01-01', sunrise: '2024-01-01T07:00:00-07:00', sunset: '2024-01-01T19:00:00-07:00' },
    ]
    mockGet.mockImplementation((url: string, config: AxiosRequestConfig) => {
      if (config.params.date === '2024-01-02') {
        return Promise.resolve({
          data: {
            results: {
              sunrise: '2024-01-02T07:01:00-07:00',
              sunset: '2024-01-02T19:01:00-07:00',
            },
          },
        })
      }
      if (config.params.date === '2024-01-03') {
        return Promise.resolve({
          data: {
            results: {
              sunrise: '2024-01-03T07:02:00-07:00',
              sunset: '2024-01-03T19:02:00-07:00',
            },
          },
        })
      }
    })
    const mockResponse: SunriseSunsets = new Map([
      ['2024-01-01', { sunrise: '2024-01-01T07:00:00-07:00', sunset: '2024-01-01T19:00:00-07:00' }],
      ['2024-01-02', { sunrise: '2024-01-02T07:01:00-07:00', sunset: '2024-01-02T19:01:00-07:00' }],
      ['2024-01-03', { sunrise: '2024-01-03T07:02:00-07:00', sunset: '2024-01-03T19:02:00-07:00' }],
    ])
    const mockStartDate = parseISO('2024-01-01')
    const mockEndDate = parseISO('2024-01-03')
    mockFind.mockResolvedValue({ docs: mockDbDocs })
    const result = await service.getSunriseSunsets(mockStartDate, mockEndDate)
    expect(mockFind).toHaveBeenCalledWith({
      selector: {
        $and: [
          {
            _id: {
              $gte: format(mockStartDate, 'yyyy-MM-dd'),
            },
          },
          {
            _id: {
              $lte: format(mockEndDate, 'yyyy-MM-dd'),
            },
          },
        ],
      },
      sort: [{ _id: 'asc' }],
      limit: 10000,
    })
    expect(mockInsert).toHaveBeenCalledWith({
      _id: '2024-01-02',
      sunrise: '2024-01-02T07:01:00-07:00',
      sunset: '2024-01-02T19:01:00-07:00',
    } as SunriseSunsetDocument)
    expect(mockInsert).toHaveBeenCalledWith({
      _id: '2024-01-03',
      sunrise: '2024-01-03T07:02:00-07:00',
      sunset: '2024-01-03T19:02:00-07:00',
    } as SunriseSunsetDocument)
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-02' } })
    expect(mockGet).toHaveBeenCalledWith('', { params: { date: '2024-01-03' } })
    expect(result).toEqual(mockResponse)
  })
})

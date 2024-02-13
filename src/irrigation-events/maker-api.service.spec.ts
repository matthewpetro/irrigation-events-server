import { Test, TestingModule } from '@nestjs/testing'
import { MakerApiService } from '@/irrigation-events/maker-api.service'
import { ConfigModule } from '@nestjs/config'
import mockData from './mocks/maker-api.mocks.json'
import axios from 'axios'

jest.mock('axios')
const mockGet = jest.fn()
axios.create = jest.fn().mockReturnValue({
  get: mockGet,
})

describe('MakerApiService', () => {
  let service: MakerApiService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ envFilePath: '.env.testing' })],
      providers: [MakerApiService],
    }).compile()

    await module.init()
    service = module.get<MakerApiService>(MakerApiService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return data correctly', async () => {
    mockGet.mockResolvedValue({ data: mockData.input })
    const deviceDetails = await service.getAllDeviceDetails()
    expect(deviceDetails).toEqual(mockData.output)
  })

  it('should return empty object if no data is returned', async () => {
    mockGet.mockResolvedValue({ data: undefined })
    const deviceDetails = await service.getAllDeviceDetails()
    expect(deviceDetails).toEqual({})
  })

  it('should return empty object if an empty array is returned', async () => {
    mockGet.mockResolvedValue({ data: [] })
    const deviceDetails = await service.getAllDeviceDetails()
    expect(deviceDetails).toEqual({})
  })
})

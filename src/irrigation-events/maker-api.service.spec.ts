import { Test, TestingModule } from '@nestjs/testing'
import { MakerApiService } from '@/irrigation-events/maker-api.service'
import { ConfigModule } from '@nestjs/config'
import axios from 'axios'
import mockData from './mocks/maker-api.mocks.json'

jest.mock('axios')

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

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return data correctly', async () => {
    const mockedGet = axios.get as jest.MockedFunction<typeof axios.get>
    mockedGet.mockResolvedValue({ data: mockData.input })
    const deviceDetails = await service.getAllDeviceDetails()
    expect(deviceDetails).toEqual(mockData.output)
  })

  it('should return empty object if no data is returned', async () => {
    const mockedGet = axios.get as jest.MockedFunction<typeof axios.get>
    mockedGet.mockResolvedValue({ data: undefined })
    const deviceDetails = await service.getAllDeviceDetails()
    expect(deviceDetails).toEqual({})
  })

  it('should return empty object if an empty array is returned', async () => {
    const mockedGet = axios.get as jest.MockedFunction<typeof axios.get>
    mockedGet.mockResolvedValue({ data: [] })
    const deviceDetails = await service.getAllDeviceDetails()
    expect(deviceDetails).toEqual({})
  })
})

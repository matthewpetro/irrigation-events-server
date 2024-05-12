import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import axios from 'axios'
import { MakerApiService } from './maker-api.service'
import { DeviceState } from '@/enums/device-state.enum'
import mockData from './mocks/maker-api.mocks.json'

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
    const deviceStates = await service.getAllDeviceStates()
    expect(deviceStates).toEqual(mockData.output)
  })

  it('should return empty object if no data is returned', async () => {
    mockGet.mockResolvedValue({ data: undefined })
    const deviceStates = await service.getAllDeviceStates()
    expect(deviceStates).toEqual({})
  })

  it('should return empty object if an empty array is returned', async () => {
    mockGet.mockResolvedValue({ data: [] })
    const deviceStates = await service.getAllDeviceStates()
    expect(deviceStates).toEqual({})
  })

  it('should return empty object if the Maker API call returns an error', async () => {
    mockGet.mockRejectedValue(new Error('Test error'))
    const deviceStates = await service.getAllDeviceStates()
    expect(deviceStates).toEqual({})
  })

  it('should set a device state correctly', async () => {
    mockGet.mockResolvedValue(undefined)
    await service.setDeviceState(42, DeviceState.ON)
    expect(mockGet).toHaveBeenCalledWith(`/42/${DeviceState.ON}`)
  })

  it('should get a device state correctly', async () => {
    mockGet.mockResolvedValue({ data: { value: DeviceState.ON } })
    const deviceState = await service.getDeviceState(42)
    expect(mockGet).toHaveBeenCalledWith(`/42/attribute/switch`)
    expect(deviceState).toEqual(DeviceState.ON)
  })

  it('should return undefined if the Maker API call returns an error', async () => {
    mockGet.mockRejectedValue(new Error('Test error'))
    const deviceState = await service.getDeviceState(42)
    expect(mockGet).toHaveBeenCalledWith(`/42/attribute/switch`)
    expect(deviceState).toBeUndefined()
  })
})

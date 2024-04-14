import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationEvent } from './interfaces/irrigation-event.interface'
import { IrrigationEventDocument } from './entities/irrigation-event.entity'
import { MakerApiEventDto } from './dto/maker-api-event.dto'
import { DeviceState } from '@/enums/device-state.enum'
import { ConfigModule } from '@nestjs/config'
import { parseISO } from 'date-fns'

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

import { IrrigationEventsService } from '@/irrigation-events/irrigation-events.service'
import { DatabaseModule } from '@/database/database.module'
import { HttpException } from '@nestjs/common'

const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/

describe('IrrigationEventsService', () => {
  let service: IrrigationEventsService
  let testingModule: TestingModule

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ envFilePath: '.env.testing' }), DatabaseModule],
      providers: [IrrigationEventsService],
    }).compile()

    await testingModule.init()
    testingModule.enableShutdownHooks()
    service = testingModule.get<IrrigationEventsService>(IrrigationEventsService)
  })

  afterEach(async () => {
    await testingModule.close()
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should insert an irrigation event', async () => {
    const mockIrrigationEvent: MakerApiEventDto = {
      name: 'Name Field',
      displayName: 'Display Name Field',
      value: DeviceState.ON,
      deviceId: 42,
    }
    const mockDocument: IrrigationEventDocument = {
      _id: expect.stringMatching(iso8601Regex),
      deviceName: mockIrrigationEvent.displayName,
      state: mockIrrigationEvent.value,
      deviceId: mockIrrigationEvent.deviceId,
    }
    mockInsert.mockResolvedValue({ ok: true })
    await service.createIrrigationEvent(mockIrrigationEvent)
    expect(mockInsert).toHaveBeenCalledWith(mockDocument)
  })

  it('should throw an exception if the database cannot insert an irrigation event', async () => {
    const mockIrrigationEvent: MakerApiEventDto = {
      name: 'Name Field',
      displayName: 'Display Name Field',
      value: DeviceState.ON,
      deviceId: 42,
    }
    mockInsert.mockResolvedValue({ ok: false })
    await expect(service.createIrrigationEvent(mockIrrigationEvent)).rejects.toThrow(HttpException)
    expect(mockInsert).toHaveBeenCalled()
  })

  it('should throw an exception if the database throws an error', async () => {
    const mockIrrigationEvent: MakerApiEventDto = {
      name: 'Name Field',
      displayName: 'Display Name Field',
      value: DeviceState.ON,
      deviceId: 42,
    }
    mockInsert.mockRejectedValue(new Error('Database error'))
    await expect(service.createIrrigationEvent(mockIrrigationEvent)).rejects.toThrow(HttpException)
    expect(mockInsert).toHaveBeenCalled()
  })

  it('should get irrigation events', async () => {
    const mockDbDocs: IrrigationEventDocument[] = [
      {
        _id: '2024-01-01T11:00:00.000Z',
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.ON,
      },
      {
        _id: '2024-01-01T12:00:00.000Z',
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.OFF,
      },
    ]
    const mockResponse: IrrigationEvent[] = [
      {
        timestamp: parseISO(mockDbDocs[0]._id),
        deviceName: mockDbDocs[0].deviceName,
        deviceId: mockDbDocs[0].deviceId,
        state: mockDbDocs[0].state,
      },
      {
        timestamp: parseISO(mockDbDocs[1]._id),
        deviceName: mockDbDocs[1].deviceName,
        deviceId: mockDbDocs[1].deviceId,
        state: mockDbDocs[1].state,
      },
    ]
    const mockStartTimestamp = '2024-01-01T00:00:00.000Z'
    const mockEndTimestamp = '2024-01-02T00:00:00.000Z'
    mockFind.mockResolvedValue({ docs: mockDbDocs })
    const result = await service.getIrrigationEvents(mockStartTimestamp, mockEndTimestamp)
    expect(mockFind).toHaveBeenCalled()
    expect(result).toEqual(mockResponse)
  })

  it('should get an empty array of irrigation events', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    const result = await service.getIrrigationEvents('2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z')
    expect(mockFind).toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('should throw an exception if the database throws an error while getting irrigation events', async () => {
    mockFind.mockRejectedValue(new Error('Database error'))
    await expect(service.getIrrigationEvents('2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z')).rejects.toThrow(
      HttpException
    )
    expect(mockFind).toHaveBeenCalled()
  })

  it('should get irrigation events before start', async () => {
    const mockDbDocs: IrrigationEventDocument[] = [
      {
        _id: '2024-01-01T23:00:00.000Z',
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.OFF,
      },
      {
        _id: '2024-01-01T22:00:00.000Z',
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.ON,
      },
    ]
    const mockResponse: IrrigationEvent[] = [
      {
        timestamp: parseISO(mockDbDocs[0]._id),
        deviceName: mockDbDocs[0].deviceName,
        deviceId: mockDbDocs[0].deviceId,
        state: mockDbDocs[0].state,
      },
      {
        timestamp: parseISO(mockDbDocs[1]._id),
        deviceName: mockDbDocs[1].deviceName,
        deviceId: mockDbDocs[1].deviceId,
        state: mockDbDocs[1].state,
      },
    ]
    const mockStartTimestamp = '2024-01-02T00:00:00.000Z'
    const mockDeviceId = 42
    mockFind.mockResolvedValue({ docs: mockDbDocs })
    const result = await service.getEventsBeforeStart(mockStartTimestamp, mockDeviceId)
    expect(mockFind).toHaveBeenCalled()
    expect(result).toEqual(mockResponse)
  })

  it('should get an empty array of irrigation events before start', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    const result = await service.getEventsBeforeStart('2024-01-01T00:00:00.000Z', 42)
    expect(mockFind).toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('should get an empty array of irrigation events before start if the databse throws an error', async () => {
    mockFind.mockRejectedValue(new Error('Database error'))
    const result = await service.getEventsBeforeStart('2024-01-01T00:00:00.000Z', 42)
    expect(mockFind).toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('should get irrigation events after end', async () => {
    const mockDbDocs: IrrigationEventDocument[] = [
      {
        _id: '2024-01-02T02:00:00.000Z',
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.ON,
      },
      {
        _id: '2024-01-01T22:00:00.000Z',
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.OFF,
      },
    ]
    const mockResponse: IrrigationEvent[] = [
      {
        timestamp: parseISO(mockDbDocs[0]._id),
        deviceName: mockDbDocs[0].deviceName,
        deviceId: mockDbDocs[0].deviceId,
        state: mockDbDocs[0].state,
      },
      {
        timestamp: parseISO(mockDbDocs[1]._id),
        deviceName: mockDbDocs[1].deviceName,
        deviceId: mockDbDocs[1].deviceId,
        state: mockDbDocs[1].state,
      },
    ]
    const mockEndTimestamp = '2024-01-02T00:00:00.000Z'
    const mockDeviceId = 42
    mockFind.mockResolvedValue({ docs: mockDbDocs })
    const result = await service.getEventsAfterEnd(mockEndTimestamp, mockDeviceId)
    expect(mockFind).toHaveBeenCalled()
    expect(result).toEqual(mockResponse)
  })

  it('should get an empty array of irrigation events after end if the databse throws an error', async () => {
    mockFind.mockRejectedValue(new Error('Database error'))
    const result = await service.getEventsAfterEnd('2024-01-01T00:00:00.000Z', 42)
    expect(mockFind).toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('should get an empty array of irrigation events after end', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    const result = await service.getEventsAfterEnd('2024-01-01T00:00:00.000Z', 42)
    expect(mockFind).toHaveBeenCalled()
    expect(result).toEqual([])
  })
})

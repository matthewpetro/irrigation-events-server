import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationEvent } from './interfaces/irrigation-event.interface'
import { IrrigationEventDocument } from './interfaces/irrigation-event-document.interface'
import { MakerApiEventDto } from './dto/maker-api-event.dto'
import { DeviceState } from './enums/device-state.interface'
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

const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/

describe('IrrigationEventsService', () => {
  let service: IrrigationEventsService
  let testingModule: TestingModule

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ envFilePath: '.env.testing' })],
      providers: [IrrigationEventsService],
    }).compile()

    await testingModule.init()
    testingModule.enableShutdownHooks()
    service = testingModule.get<IrrigationEventsService>(IrrigationEventsService)
  })

  afterEach(async () => {
    await testingModule.close()
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
    await service.insertIrrigationEvent(mockIrrigationEvent)
    expect(mockInsert).toHaveBeenCalledWith(mockDocument)
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
    expect(mockFind).toHaveBeenCalledWith({
      selector: {
        $and: [
          {
            _id: {
              $gt: mockStartTimestamp,
            },
          },
          {
            _id: {
              $lt: mockEndTimestamp,
            },
          },
        ],
      },
      sort: [{ _id: 'asc' }],
      limit: 10000,
    })
    expect(result).toEqual(mockResponse)
  })

  it('should get an empty array of irrigation events', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    const result = await service.getIrrigationEvents('2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z')
    expect(mockFind).toHaveBeenCalled()
    expect(result).toEqual([])
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
    expect(mockFind).toHaveBeenCalledWith({
      selector: {
        $and: [
          {
            _id: {
              $lt: mockStartTimestamp,
            },
          },
          {
            deviceId: {
              $eq: mockDeviceId,
            },
          },
        ],
      },
      limit: 2,
      sort: [
        {
          _id: 'desc',
        },
      ],
    })
    expect(result).toEqual(mockResponse)
  })

  it('should get an empty array of irrigation events before start', async () => {
    mockFind.mockResolvedValue({ docs: [] })
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
    expect(mockFind).toHaveBeenCalledWith({
      selector: {
        $and: [
          {
            _id: {
              $gt: mockEndTimestamp,
            },
          },
          {
            deviceId: {
              $eq: mockDeviceId,
            },
          },
        ],
      },
      limit: 2,
      sort: [
        {
          _id: 'asc',
        },
      ],
    })
    expect(result).toEqual(mockResponse)
  })

  it('should get an empty array of irrigation events after end', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    const result = await service.getEventsAfterEnd('2024-01-01T00:00:00.000Z', 42)
    expect(mockFind).toHaveBeenCalled()
    expect(result).toEqual([])
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationEventDocument } from './interfaces/irrigation-event-document.interface'
import { MakerApiEventDto } from './dto/maker-api-event.dto'
import { DeviceState } from './enums/device-state.interface'
import { ConfigModule } from '@nestjs/config'

// Mock the Nano library
const mockInsert = jest.fn().mockResolvedValue({})
const mockGet = jest.fn().mockResolvedValue({})
jest.mock('nano', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        auth: jest.fn(),
        db: {
          use: jest.fn().mockReturnValue({
            get: mockGet,
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

    testingModule.init()
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
})

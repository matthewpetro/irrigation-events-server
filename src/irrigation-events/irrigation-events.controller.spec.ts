import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationEventsController } from '@/irrigation-events/irrigation-events.controller'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { ViewmodelTransformService } from './viewmodel-transform.service'
import { IrrigationEventsService } from './irrigation-events.service'
import { ConfigModule } from '@nestjs/config'
import { DeviceState } from '@/enums/device-state.enum'
import { MakerApiEventDto } from './dto/maker-api-event.dto'
import { IrrigationEvent } from './interfaces/irrigation-event.interface'
import { parseISO } from 'date-fns'
import { IrrigationEventViewmodel } from './dto/irrigation-event-viewmodel.dto'

const mockIrrigationEventsService = {
  createIrrigationEvent: jest.fn(),
  getIrrigationEvents: jest.fn(),
  getEventsBeforeStart: jest.fn(),
  getEventsAfterEnd: jest.fn(),
}

const mockMakerApiService = {
  getAllDeviceStates: jest.fn(),
}

describe('IrrigationEventsController', () => {
  let controller: IrrigationEventsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ envFilePath: '.env.local' })],
      controllers: [IrrigationEventsController],
      providers: [ViewmodelTransformService],
    })
      .useMocker((token) => {
        if (token === IrrigationEventsService) {
          return mockIrrigationEventsService
        }
        if (token === MakerApiService) {
          return mockMakerApiService
        }
      })
      .compile()

    controller = module.get<IrrigationEventsController>(IrrigationEventsController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should call createIrrigationEvent', async () => {
    const makerApiEventDto = {
      name: 'switch',
      displayName: 'Device 1',
      deviceId: 1,
      value: DeviceState.ON,
    } as MakerApiEventDto
    await controller.create(makerApiEventDto)
    expect(mockIrrigationEventsService.createIrrigationEvent).toHaveBeenCalledWith(makerApiEventDto)
  })

  it('should return viewmodels', async () => {
    mockIrrigationEventsService.getIrrigationEvents.mockResolvedValue([
      {
        timestamp: parseISO('2024-01-01T10:00:00.000Z'),
        deviceName: 'Device 1',
        deviceId: 1,
        state: DeviceState.ON,
      },
      {
        timestamp: parseISO('2024-01-01T11:00:00.000Z'),
        deviceName: 'Device 1',
        deviceId: 1,
        state: DeviceState.OFF,
      },
      {
        timestamp: parseISO('2024-01-01T11:00:00.000Z'),
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.ON,
      },
      {
        timestamp: parseISO('2024-01-01T12:00:00.000Z'),
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.OFF,
      },
    ] as IrrigationEvent[])
    const startTimestamp = '2024-01-01T00:00:00.000Z'
    const endTimestamp = '2024-01-02T00:00:00.000Z'
    const viewmodels = await controller.get({ startTimestamp, endTimestamp })
    expect(mockIrrigationEventsService.getIrrigationEvents).toHaveBeenCalledWith(startTimestamp, endTimestamp)
    expect(viewmodels).toEqual([
      {
        startTimestamp: '2024-01-01T10:00:00.000Z',
        endTimestamp: '2024-01-01T11:00:00.000Z',
        title: 'Device 1',
        deviceId: 1,
      },
      {
        startTimestamp: '2024-01-01T11:00:00.000Z',
        endTimestamp: '2024-01-01T12:00:00.000Z',
        title: 'Device 42',
        deviceId: 42,
      },
    ] as IrrigationEventViewmodel[])
  })

  it('should get events before the start of the time range', async () => {
    mockIrrigationEventsService.getIrrigationEvents.mockResolvedValue([
      {
        timestamp: parseISO('2024-01-01T12:00:00.000Z'),
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.OFF,
      },
    ] as IrrigationEvent[])
    mockIrrigationEventsService.getEventsBeforeStart.mockResolvedValue([
      {
        timestamp: parseISO('2024-01-01T11:00:00.000Z'),
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.ON,
      },
    ] as IrrigationEvent[])
    const startTimestamp = '2024-01-01T11:30:00.000Z'
    const endTimestamp = '2024-01-02T00:00:00.000Z'
    const viewmodels = await controller.get({ startTimestamp, endTimestamp })
    expect(mockIrrigationEventsService.getIrrigationEvents).toHaveBeenCalledWith(startTimestamp, endTimestamp)
    expect(mockIrrigationEventsService.getEventsBeforeStart).toHaveBeenCalledWith(startTimestamp, 42)
    expect(viewmodels).toEqual([
      {
        startTimestamp: '2024-01-01T11:00:00.000Z',
        endTimestamp: '2024-01-01T12:00:00.000Z',
        title: 'Device 42',
        deviceId: 42,
      },
    ] as IrrigationEventViewmodel[])
  })

  it('should get events after the end of the time range', async () => {
    mockIrrigationEventsService.getIrrigationEvents.mockResolvedValue([
      {
        timestamp: parseISO('2024-01-01T11:00:00.000Z'),
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.ON,
      },
    ] as IrrigationEvent[])
    mockIrrigationEventsService.getEventsAfterEnd.mockResolvedValue([
      {
        timestamp: parseISO('2024-01-01T12:00:00.000Z'),
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.OFF,
      },
    ] as IrrigationEvent[])
    const startTimestamp = '2024-01-01T00:00:00.000Z'
    const endTimestamp = '2024-01-02T11:30:00.000Z'
    const viewmodels = await controller.get({ startTimestamp, endTimestamp })
    expect(mockIrrigationEventsService.getIrrigationEvents).toHaveBeenCalledWith(startTimestamp, endTimestamp)
    expect(mockIrrigationEventsService.getEventsAfterEnd).toHaveBeenCalledWith(endTimestamp, 42)
    expect(viewmodels).toEqual([
      {
        startTimestamp: '2024-01-01T11:00:00.000Z',
        endTimestamp: '2024-01-01T12:00:00.000Z',
        title: 'Device 42',
        deviceId: 42,
      },
    ] as IrrigationEventViewmodel[])
  })

  it('should add current device states', async () => {
    mockIrrigationEventsService.getIrrigationEvents.mockResolvedValue([
      {
        timestamp: parseISO('2024-01-01T11:00:00.000Z'),
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.ON,
      },
    ] as IrrigationEvent[])
    mockIrrigationEventsService.getEventsAfterEnd.mockResolvedValue([])
    mockMakerApiService.getAllDeviceStates.mockResolvedValue({ 42: DeviceState.ON })
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-01T11:30:00.000Z').getTime())
    const startTimestamp = '2024-01-01T00:00:00.000Z'
    const endTimestamp = '2024-01-02T00:00:00.000Z'
    const viewmodels = await controller.get({ startTimestamp, endTimestamp })
    expect(mockIrrigationEventsService.getIrrigationEvents).toHaveBeenCalledWith(startTimestamp, endTimestamp)
    expect(mockMakerApiService.getAllDeviceStates).toHaveBeenCalled()
    expect(viewmodels).toEqual([
      {
        startTimestamp: '2024-01-01T11:00:00.000Z',
        endTimestamp: '2024-01-01T11:30:00.000Z',
        title: 'Device 42',
        deviceId: 42,
        currentlyOn: true,
      },
    ] as IrrigationEventViewmodel[])
    dateSpy.mockRestore()
  })
})

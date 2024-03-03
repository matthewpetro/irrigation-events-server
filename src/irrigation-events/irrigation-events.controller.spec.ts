import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationEventsController } from '@/irrigation-events/irrigation-events.controller'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { ViewmodelTransformService } from './viewmodel-transform.service'
import { IrrigationEventsService } from './irrigation-events.service'
import { ConfigModule } from '@nestjs/config'
import { DeviceState } from '@/enums/device-state.interface'
import { MakerApiEventDto } from './dto/maker-api-event.dto'
import { IrrigationEvent } from './interfaces/irrigation-event.interface'
import { parseISO } from 'date-fns'
import { IrrigationEventViewmodel } from './dto/irrigation-event-viewmodel.dto'

describe('IrrigationEventsController', () => {
  let controller: IrrigationEventsController
  const mockInsertIrrigationEvent = jest.fn()
  const mockGetIrrigationEvents = jest.fn()
  const mockGetEventsBeforeStart = jest.fn()
  const mockGetEventsAfterEnd = jest.fn()
  const mockGetAllDeviceDetails = jest.fn()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ envFilePath: '.env.local' })],
      controllers: [IrrigationEventsController],
      providers: [ViewmodelTransformService],
    })
      .useMocker((token) => {
        if (token === IrrigationEventsService) {
          return {
            insertIrrigationEvent: mockInsertIrrigationEvent,
            getIrrigationEvents: mockGetIrrigationEvents,
            getEventsBeforeStart: mockGetEventsBeforeStart,
            getEventsAfterEnd: mockGetEventsAfterEnd,
          }
        }
        if (token === MakerApiService) {
          return {
            getAllDeviceDetails: mockGetAllDeviceDetails,
          }
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

  it('should call insertIrrigationEvent', async () => {
    const makerApiEventDto = {
      name: 'switch',
      displayName: 'Device 1',
      deviceId: 1,
      value: DeviceState.ON,
    } as MakerApiEventDto
    await controller.create(makerApiEventDto)
    expect(mockInsertIrrigationEvent).toHaveBeenCalledWith(makerApiEventDto)
  })

  it('should return viewmodels', async () => {
    mockGetIrrigationEvents.mockResolvedValue([
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
    expect(mockGetIrrigationEvents).toHaveBeenCalledWith(startTimestamp, endTimestamp)
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
    mockGetIrrigationEvents.mockResolvedValue([
      {
        timestamp: parseISO('2024-01-01T12:00:00.000Z'),
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.OFF,
      },
    ] as IrrigationEvent[])
    mockGetEventsBeforeStart.mockResolvedValue([
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
    expect(mockGetIrrigationEvents).toHaveBeenCalledWith(startTimestamp, endTimestamp)
    expect(mockGetEventsBeforeStart).toHaveBeenCalledWith(startTimestamp, 42)
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
    mockGetIrrigationEvents.mockResolvedValue([
      {
        timestamp: parseISO('2024-01-01T11:00:00.000Z'),
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.ON,
      },
    ] as IrrigationEvent[])
    mockGetEventsAfterEnd.mockResolvedValue([
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
    expect(mockGetIrrigationEvents).toHaveBeenCalledWith(startTimestamp, endTimestamp)
    expect(mockGetEventsAfterEnd).toHaveBeenCalledWith(endTimestamp, 42)
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
    mockGetIrrigationEvents.mockResolvedValue([
      {
        timestamp: parseISO('2024-01-01T11:00:00.000Z'),
        deviceName: 'Device 42',
        deviceId: 42,
        state: DeviceState.ON,
      },
    ] as IrrigationEvent[])
    mockGetEventsAfterEnd.mockResolvedValue([])
    mockGetAllDeviceDetails.mockResolvedValue({ 42: DeviceState.ON })
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-01T11:30:00.000Z').getTime())
    const startTimestamp = '2024-01-01T00:00:00.000Z'
    const endTimestamp = '2024-01-02T00:00:00.000Z'
    const viewmodels = await controller.get({ startTimestamp, endTimestamp })
    expect(mockGetIrrigationEvents).toHaveBeenCalledWith(startTimestamp, endTimestamp)
    expect(mockGetAllDeviceDetails).toHaveBeenCalled()
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

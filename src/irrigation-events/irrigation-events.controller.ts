import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common'
import { IsISO8601 } from 'class-validator'
import { isWithinInterval, parseISO } from 'date-fns'
import { IrrigationEventsService } from './irrigation-events.service'
import { IrrigationEventDocument } from './interfaces/irrigation-event-document.interface'
import { MakerApiEventDto } from './dto/maker-api-event.dto'
import { DeviceState } from './enums/device-state.interface'
import { MakerApiService } from './maker-api.service'
import { ViewmodelTransformService } from './viewmodel-transform.service'
import { DeviceEvents } from './device-events'

class QueryParameters {
  @IsISO8601()
  startTimestamp: string
  @IsISO8601()
  endTimestamp: string
}

const isCurrentTimeWithinInterval = (startTimestamp: string, endTimestamp: string) =>
  isWithinInterval(Date.now(), { start: parseISO(startTimestamp), end: parseISO(endTimestamp) })

const makerEventToIrrigationEvent = ({ displayName, value, deviceId }: MakerApiEventDto) =>
  ({
    _id: new Date().toISOString(),
    deviceName: displayName,
    state: value,
    deviceId,
  }) as IrrigationEventDocument

const createDeviceEvents = (dbDocuments: IrrigationEventDocument[]): DeviceEvents[] => {
  const deviceEvents: DeviceEvents[] = []
  const deviceIds = new Set<number>()
  dbDocuments.forEach((event) => {
    deviceIds.add(event.deviceId)
  })
  deviceIds.forEach((deviceId) => {
    const events = dbDocuments.filter((event) => event.deviceId === deviceId)
    deviceEvents.push(new DeviceEvents(deviceId, events))
  })
  return deviceEvents
}

@Controller('irrigation-events')
export class IrrigationEventsController {
  constructor(
    private irrigationEventsService: IrrigationEventsService,
    private makerApiService: MakerApiService,
    private viewmodelTransformService: ViewmodelTransformService
  ) {}

  @Post()
  @UsePipes(
    new ValidationPipe({ transform: true, whitelist: true, transformOptions: { enableImplicitConversion: true } })
  )
  async create(@Body('content') makerApiEventContent: MakerApiEventDto) {
    this.irrigationEventsService.insertIrrigationEvent(makerEventToIrrigationEvent(makerApiEventContent))
  }

  @Get()
  @UsePipes(new ValidationPipe())
  async get(@Query() { startTimestamp, endTimestamp }: QueryParameters) {
    const irrigationEvents = await this.irrigationEventsService.getIrrigationEvents(startTimestamp, endTimestamp)
    const deviceEventsList = createDeviceEvents(irrigationEvents)
    await this.addEventsOutsideTimeRange(deviceEventsList, startTimestamp, endTimestamp)
    if (isCurrentTimeWithinInterval(startTimestamp, endTimestamp)) {
      this.addCurrentDeviceStates(deviceEventsList)
    }
    return this.viewmodelTransformService.transform(deviceEventsList)
  }

  private async addEventsOutsideTimeRange(
    deviceEventLists: DeviceEvents[],
    startTimestamp: string,
    endTimestamp: string
  ): Promise<void> {
    const appendOnEventPromises = deviceEventLists.map(async (deviceEvents) => {
      if (deviceEvents.getFirstEvent().state !== DeviceState.ON) {
        const eventsBeforeStart = await this.irrigationEventsService.getEventsBeforeStart(
          startTimestamp,
          deviceEvents.getDeviceId()
        )
        if (eventsBeforeStart[0]?.state === DeviceState.ON) {
          deviceEvents.addEvent(eventsBeforeStart[0])
        }
      }
    })
    await Promise.allSettled(appendOnEventPromises)

    const appendOffEventPromises = deviceEventLists.map(async (deviceEvents) => {
      if (deviceEvents.getLastEvent().state !== DeviceState.OFF) {
        const eventsAfterEnd = await this.irrigationEventsService.getEventsAfterEnd(
          endTimestamp,
          deviceEvents.getDeviceId()
        )
        if (eventsAfterEnd[0]?.state === DeviceState.OFF) {
          deviceEvents.addEvent(eventsAfterEnd[0])
        }
      }
    })
    await Promise.allSettled(appendOffEventPromises)
  }

  private async addCurrentDeviceStates(deviceEventsList: DeviceEvents[]): Promise<void> {
    const makerEvents = await this.makerApiService.getAllDeviceStates()
    deviceEventsList.forEach((device) => {
      const currentDeviceState = makerEvents[device.getDeviceId()]
      device.setCurrentDeviceState(currentDeviceState)
    })
  }
}

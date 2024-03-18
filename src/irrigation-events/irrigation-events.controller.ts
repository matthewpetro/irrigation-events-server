import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common'
import { IsISO8601 } from 'class-validator'
import { isWithinInterval, parseISO } from 'date-fns'
import { IrrigationEventsService } from './irrigation-events.service'
import { IrrigationEvent } from './interfaces/irrigation-event.interface'
import { MakerApiEventDto } from './dto/maker-api-event.dto'
import { DeviceState } from '@/enums/device-state.interface'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { ViewmodelTransformService } from './viewmodel-transform.service'
import { DeviceEvents } from './interfaces/device-events.interface'

class QueryParameters {
  @IsISO8601()
  startTimestamp: string
  @IsISO8601()
  endTimestamp: string
}

const isCurrentTimeWithinInterval = (startTimestamp: string, endTimestamp: string) =>
  isWithinInterval(Date.now(), { start: parseISO(startTimestamp), end: parseISO(endTimestamp) })

const irrigationEventsToDeviceEvents = (irrigationEvents: IrrigationEvent[]): DeviceEvents[] => {
  const deviceEvents: DeviceEvents[] = []
  // Use a Set to quickly get a list of unique device IDs
  const deviceIds = new Set<number>()
  irrigationEvents.forEach((event) => {
    deviceIds.add(event.deviceId)
  })
  deviceIds.forEach((deviceId) => {
    const events = irrigationEvents.filter((event) => event.deviceId === deviceId)
    deviceEvents.push({ deviceId, events } as DeviceEvents)
  })
  return deviceEvents
}

// TODO: add error handling in this controller

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
    this.irrigationEventsService.insertIrrigationEvent(makerApiEventContent)
  }

  @Get()
  @UsePipes(new ValidationPipe())
  async get(@Query() { startTimestamp, endTimestamp }: QueryParameters) {
    const irrigationEvents = await this.irrigationEventsService.getIrrigationEvents(startTimestamp, endTimestamp)
    const deviceEventsList = irrigationEventsToDeviceEvents(irrigationEvents)
    await this.addEventsOutsideTimeRange(deviceEventsList, startTimestamp, endTimestamp)
    if (isCurrentTimeWithinInterval(startTimestamp, endTimestamp)) {
      await this.addCurrentDeviceStates(deviceEventsList)
    }
    return this.viewmodelTransformService.transform(deviceEventsList)
  }

  private async addEventsOutsideTimeRange(
    deviceEventLists: DeviceEvents[],
    startTimestamp: string,
    endTimestamp: string
  ): Promise<void> {
    const appendOnEventPromises = deviceEventLists.map(async (deviceEvents) => {
      // If the first event is an OFF event, that probably means the ON event occurred
      // prior to the beginning of the time range. Check for an ON event before the start
      // and add it to the list of events if we find one.
      if (deviceEvents.events[0]?.state === DeviceState.OFF) {
        const eventsBeforeStart = await this.irrigationEventsService.getEventsBeforeStart(
          startTimestamp,
          deviceEvents.deviceId
        )
        if (eventsBeforeStart[0]?.state === DeviceState.ON) {
          deviceEvents.events.push(eventsBeforeStart[0])
        }
      }
    })
    await Promise.allSettled(appendOnEventPromises)

    // If the last event is an ON event, that probably means the OFF event occurred
    // after the end of the time range. Check for an OFF event after the end and add
    // it to the list of events if we find one.
    const appendOffEventPromises = deviceEventLists.map(async (deviceEvents) => {
      if (deviceEvents.events[deviceEvents.events.length - 1].state === DeviceState.ON) {
        const eventsAfterEnd = await this.irrigationEventsService.getEventsAfterEnd(endTimestamp, deviceEvents.deviceId)
        if (eventsAfterEnd[0]?.state === DeviceState.OFF) {
          deviceEvents.events.push(eventsAfterEnd[0])
        }
      }
    })
    await Promise.allSettled(appendOffEventPromises)
  }

  private async addCurrentDeviceStates(deviceEventsList: DeviceEvents[]): Promise<void> {
    const deviceStates = await this.makerApiService.getAllDeviceStates()
    deviceEventsList.forEach((deviceEvents) => {
      deviceEvents.currentDeviceState = deviceStates[deviceEvents.deviceId]
    })
  }
}

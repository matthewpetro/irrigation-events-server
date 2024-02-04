import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common'
import { IsISO8601 } from 'class-validator'
import { isWithinInterval, parseISO } from 'date-fns'
import { IrrigationEventsService } from './irrigation-events.service'
import { IrrigationEventDocument } from './interfaces/irrigation-event-document.interface'
import { MakerApiEventDto } from './dto/maker-api-event-dto'
import { DeviceState } from './enums/device-state.interface'
import { MakerApiService } from './maker-api.service'
import { ViewmodelTransformService } from './viewmodel-transform.service'

class QueryParameters {
  @IsISO8601()
  startTimestamp: string
  @IsISO8601()
  endTimestamp: string
}

type DeviceEventLists = { [deviceId: string]: IrrigationEventDocument[] }

const shouldPrependAdditionalOnEvent = (events: IrrigationEventDocument[]) =>
  events && events.length >= 1 && events[0].state === DeviceState.ON

const shouldAppendAdditionalOffEvent = (events: IrrigationEventDocument[]) =>
  events && events.length >= 1 && events[0].state === DeviceState.OFF

const isCurrentTimeWithinInterval = (startTimestamp: string, endTimestamp: string) =>
  isWithinInterval(Date.now(), { start: parseISO(startTimestamp), end: parseISO(endTimestamp) })

const makerEventToIrrigationEvent = ({ displayName, value, deviceId }: MakerApiEventDto) =>
  ({
    _id: new Date().toISOString(),
    deviceName: displayName,
    state: value,
    deviceId,
  }) as IrrigationEventDocument

// Split the list of events into lists by deviceId
const createDeviceEventLists = (dbDocuments: IrrigationEventDocument[]): DeviceEventLists =>
  dbDocuments.reduce(
    (accumulator, event) => {
      const deviceId = event.deviceId.toString()
      if (!accumulator[deviceId]) {
        accumulator[deviceId] = []
      }
      accumulator[deviceId].push(event)
      return accumulator
    },
    // I'd like to leave deviceId as a number, but Object.entries()
    // would convert it to a string.
    {} as { [deviceId: string]: IrrigationEventDocument[] }
  )

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
    const deviceEventLists = createDeviceEventLists(irrigationEvents)
    const eventLists = await this.addMissingEvents(deviceEventLists, startTimestamp, endTimestamp)
    const currentDeviceStates = isCurrentTimeWithinInterval(startTimestamp, endTimestamp)
      ? await this.makerApiService.getAllDeviceStates()
      : {}
    return this.viewmodelTransformService.transform(eventLists, currentDeviceStates)
  }

  private readonly addMissingEvents = async (
    deviceEventLists: DeviceEventLists,
    startTimestamp: string,
    endTimestamp: string
  ): Promise<IrrigationEventDocument[][]> => {
    const eventListEntries = Object.entries(deviceEventLists)
    const appendOnEventPromises = eventListEntries.map(async ([deviceId, deviceEvents]) => {
      if (deviceEvents[0].state !== DeviceState.ON) {
        const eventsBeforeStart = await this.irrigationEventsService.getEventsBeforeStart(
          startTimestamp,
          parseInt(deviceId, 10)
        )
        if (shouldPrependAdditionalOnEvent(eventsBeforeStart)) {
          deviceEvents.unshift(eventsBeforeStart[0])
        }
      }
    })
    await Promise.allSettled(appendOnEventPromises)

    const appendOffEventPromises = eventListEntries.map(async ([deviceId, deviceEvents]) => {
      if (deviceEvents[deviceEvents.length - 1].state !== DeviceState.OFF) {
        const eventsAfterEnd = await this.irrigationEventsService.getEventsAfterEnd(
          endTimestamp,
          parseInt(deviceId, 10)
        )
        if (shouldAppendAdditionalOffEvent(eventsAfterEnd)) {
          deviceEvents.push(eventsAfterEnd[0])
        }
      }
    })
    await Promise.allSettled(appendOffEventPromises)

    return Object.values(deviceEventLists)
  }
}

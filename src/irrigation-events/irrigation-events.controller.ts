import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common'
import { IrrigationEventsService } from './irrigation-events.service'
import { IrrigationEventDocument } from './interfaces/irrigation-event-document.interface'
import { MakerApiEventDto } from './dto/maker-api-event-dto'
import { IsISO8601 } from 'class-validator'

const makerEventToIrrigationEvent = ({ displayName, value, deviceId }: MakerApiEventDto) =>
  ({
    _id: new Date().toISOString(),
    deviceName: displayName,
    state: value,
    deviceId,
  }) as IrrigationEventDocument

class QueryParameters {
  @IsISO8601()
  startTimestamp: string
  @IsISO8601()
  endTimestamp: string
}
@Controller('irrigation-events')
export class IrrigationEventsController {
  constructor(private irrigationEventsService: IrrigationEventsService) {}

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
    console.log(`start: ${startTimestamp}, end: ${endTimestamp}`)
    const irrigationEvents = await this.irrigationEventsService.getIrrigationEvents(startTimestamp, endTimestamp)
  }
}

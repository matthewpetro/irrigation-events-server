import { Body, Controller, Get, Post, UsePipes, ValidationPipe } from '@nestjs/common'
import { IrrigationEventsService } from './irrigation-events.service'
import { IrrigationEventDocument } from './interfaces/irrigation-event-document.interface'
import { MakerApiEventDto } from './dto/maker-api-event-dto'

const makerEventToIrrigationEvent = ({ displayName, value, deviceId }: MakerApiEventDto) =>
  ({
    _id: new Date().toISOString(),
    deviceName: displayName,
    state: value,
    deviceId,
  }) as IrrigationEventDocument

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
  async get() {
    return {}
  }
}

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { IrrigationEventsService } from '@/irrigation-events/irrigation-events.service'
import { IrrigationEventsController } from '@/irrigation-events/irrigation-events.controller'
import { MakerApiService } from './maker-api.service'
import { ViewmodelTransformService } from './viewmodel-transform.service'

@Module({
  imports: [ConfigModule],
  controllers: [IrrigationEventsController],
  providers: [IrrigationEventsService, MakerApiService, ViewmodelTransformService],
})
export class IrrigationEventsModule {}

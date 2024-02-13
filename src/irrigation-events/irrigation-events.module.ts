import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { IrrigationEventsService } from '@/irrigation-events/irrigation-events.service'
import { IrrigationEventsController } from '@/irrigation-events/irrigation-events.controller'
import { MakerApiService } from './maker-api.service'
import { ViewmodelTransformService } from './viewmodel-transform.service'
import { DatabaseModule } from '@/database/database.module'

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [IrrigationEventsController],
  providers: [IrrigationEventsService, MakerApiService, ViewmodelTransformService],
})
export class IrrigationEventsModule {}

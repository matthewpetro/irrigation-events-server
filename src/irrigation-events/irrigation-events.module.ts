import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MakerApiModule } from '@/maker-api/maker-api.module'
import { IrrigationEventsService } from '@/irrigation-events/irrigation-events.service'
import { IrrigationEventsController } from '@/irrigation-events/irrigation-events.controller'
import { DatabaseModule } from '@/database/database.module'
import { ViewmodelTransformService } from './viewmodel-transform.service'

@Module({
  imports: [ConfigModule, DatabaseModule, MakerApiModule],
  controllers: [IrrigationEventsController],
  providers: [IrrigationEventsService, ViewmodelTransformService],
})
export class IrrigationEventsModule {}

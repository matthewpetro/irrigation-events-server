import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { IrrigationEventsService } from '@/irrigation-events/irrigation-events.service'
import { IrrigationEventsController } from '@/irrigation-events/irrigation-events.controller'

@Module({
  imports: [ConfigModule],
  controllers: [IrrigationEventsController],
  providers: [IrrigationEventsService],
})
export class IrrigationEventsModule {}

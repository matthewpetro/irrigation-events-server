import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { IrrigationEventsController } from './irrigation-events/irrigation-events.controller'
import { IrrigationEventsService } from './irrigation-events/irrigation-events.service'

@Module({
  imports: [],
  controllers: [AppController, IrrigationEventsController],
  providers: [AppService, IrrigationEventsService],
})
export class AppModule {}

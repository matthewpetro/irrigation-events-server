import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'
import { DevtoolsModule } from '@nestjs/devtools-integration'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { IrrigationEventsModule } from './irrigation-events/irrigation-events.module'
import { SunriseSunsetModule } from './sunrise-sunset/sunrise-sunset.module'
import { IrrigationProgramsModule } from './irrigation-programs/irrigation-programs.module'
import { MakerApiModule } from './maker-api/maker-api.module'
import { IrrigationSchedulerModule } from './irrigation-scheduler/irrigation-scheduler.module'
import { RainDelayModule } from './rain-delay/rain-delay.module'

@Module({
  imports: [
    DevtoolsModule.register({ http: process.env.NODE_ENV !== 'production' }),
    ConfigModule.forRoot({ envFilePath: '.env.local' }),
    ScheduleModule.forRoot(),
    IrrigationEventsModule,
    SunriseSunsetModule,
    IrrigationProgramsModule,
    MakerApiModule,
    IrrigationSchedulerModule,
    RainDelayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

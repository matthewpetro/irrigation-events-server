import { Module } from '@nestjs/common'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { ConfigModule } from '@nestjs/config'
import { IrrigationEventsModule } from './irrigation-events/irrigation-events.module'
import { DevtoolsModule } from '@nestjs/devtools-integration'
import { SunriseSunsetModule } from './sunrise-sunset/sunrise-sunset.module'
import { IrrigationProgramsModule } from './irrigation-programs/irrigation-programs.module'

@Module({
  imports: [
    DevtoolsModule.register({ http: process.env.NODE_ENV !== 'production' }),
    ConfigModule.forRoot({ envFilePath: '.env.local' }),
    IrrigationEventsModule,
    SunriseSunsetModule,
    IrrigationProgramsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

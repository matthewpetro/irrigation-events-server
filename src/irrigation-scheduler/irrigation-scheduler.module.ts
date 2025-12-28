import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { IrrigationProgramsModule } from '@/irrigation-programs/irrigation-programs.module'
import { MakerApiModule } from '@/maker-api/maker-api.module'
import { SunriseSunsetModule } from '@/sunrise-sunset/sunrise-sunset.module'
import { IrrigationSchedulerService } from './irrigation-scheduler.service'

@Module({
  imports: [ConfigModule, IrrigationProgramsModule, MakerApiModule, SunriseSunsetModule],
  providers: [IrrigationSchedulerService],
})
export class IrrigationSchedulerModule {}

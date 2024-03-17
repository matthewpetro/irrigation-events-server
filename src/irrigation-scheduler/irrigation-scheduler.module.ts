import { Module } from '@nestjs/common'
import { IrrigationSchedulerService } from './irrigation-scheduler.service'
import { IrrigationProgramsModule } from '@/irrigation-programs/irrigation-programs.module'
import { MakerApiModule } from '@/maker-api/maker-api.module'
import { SunriseSunsetModule } from '@/sunrise-sunset/sunrise-sunset.module'

@Module({
  imports: [IrrigationProgramsModule, MakerApiModule, SunriseSunsetModule],
  providers: [IrrigationSchedulerService],
})
export class IrrigationSchedulerModule {}

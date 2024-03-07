import { Module } from '@nestjs/common'
import { IrrigationSchedulerService } from './irrigation-scheduler.service'
import { IrrigationProgramsService } from '@/irrigation-programs/irrigation-programs.service'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { SunriseSunsetService } from '@/sunrise-sunset/sunrise-sunset.service'

@Module({
  imports: [IrrigationProgramsService, MakerApiService, SunriseSunsetService],
  providers: [IrrigationSchedulerService],
})
export class IrrigationSchedulerModule {}

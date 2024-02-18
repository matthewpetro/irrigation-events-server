import { Module } from '@nestjs/common'
import { WateringProgramsService } from './watering-programs.service'
import { WateringProgramsController } from './watering-programs.controller'

@Module({
  controllers: [WateringProgramsController],
  providers: [WateringProgramsService],
})
export class WateringProgramsModule {}

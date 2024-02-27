import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { IrrigationProgramsService } from './watering-programs.service'
import { IrrigationProgramsController } from './watering-programs.controller'
import { DatabaseModule } from '@/database/database.module'

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [IrrigationProgramsController],
  providers: [IrrigationProgramsService],
})
export class IrrigationProgramsModule {}

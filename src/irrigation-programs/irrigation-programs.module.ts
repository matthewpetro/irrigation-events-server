import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { IrrigationProgramsService } from './irrigation-programs.service'
import { IrrigationProgramsController } from './irrigation-programs.controller'
import { DatabaseModule } from '@/database/database.module'

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [IrrigationProgramsController],
  providers: [IrrigationProgramsService],
  exports: [IrrigationProgramsService],
})
export class IrrigationProgramsModule {}

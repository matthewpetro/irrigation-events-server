import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RainDelayService } from './rain-delay.service'
import { RainDelayController } from './rain-delay.controller'
import { DatabaseModule } from '@/database/database.module'

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [RainDelayController],
  providers: [RainDelayService],
  exports: [RainDelayService],
})
export class RainDelayModule {}

import { Module } from '@nestjs/common'
import { RainDelayService } from './rain-delay.service'
import { RainDelayController } from './rain-delay.controller'

@Module({
  controllers: [RainDelayController],
  providers: [RainDelayService],
  exports: [RainDelayService],
})
export class RainDelayModule {}

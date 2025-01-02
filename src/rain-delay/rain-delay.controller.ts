import { Controller, Get, Body, Patch } from '@nestjs/common'
import { RainDelayService } from './rain-delay.service'
import { RainDelayDto } from './dto/rain-delay.dto'

@Controller('rain-delay')
export class RainDelayController {
  constructor(private readonly rainDelayService: RainDelayService) {}

  @Get()
  async get() {
    return this.rainDelayService.get()
  }

  @Patch()
  async update(@Body() rainDelayDto: RainDelayDto) {
    await this.rainDelayService.update(rainDelayDto)
  }
}

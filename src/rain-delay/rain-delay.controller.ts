import { Controller, Get, Body, Patch, Delete } from '@nestjs/common'
import { RainDelayService } from './rain-delay.service'
import { RainDelayDto } from './dto/rain-delay.dto'

@Controller('rain-delay')
export class RainDelayController {
  constructor(private readonly rainDelayService: RainDelayService) {}

  @Get()
  get() {
    return this.rainDelayService.get()
  }

  @Patch()
  update(@Body() rainDelayDto: RainDelayDto) {
    return this.rainDelayService.update(rainDelayDto)
  }

  @Delete()
  remove() {
    return this.rainDelayService.remove()
  }
}

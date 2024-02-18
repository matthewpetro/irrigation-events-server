import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { WateringProgramsService } from './watering-programs.service'
import { CreateWateringProgramDto } from './dto/create-watering-program.dto'
import { UpdateWateringProgramDto } from './dto/update-watering-program.dto'

@Controller('watering-programs')
export class WateringProgramsController {
  constructor(private readonly wateringProgramsService: WateringProgramsService) {}

  @Post()
  create(@Body() createWateringProgramDto: CreateWateringProgramDto) {
    return this.wateringProgramsService.create(createWateringProgramDto)
  }

  @Get()
  findAll() {
    return this.wateringProgramsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wateringProgramsService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWateringProgramDto: UpdateWateringProgramDto) {
    return this.wateringProgramsService.update(+id, updateWateringProgramDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wateringProgramsService.remove(+id)
  }
}

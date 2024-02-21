import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common'
import { WateringProgramsService } from './watering-programs.service'
import { CreateWateringProgramDto } from './dto/create-watering-program.dto'
import { UpdateWateringProgramDto } from './dto/update-watering-program.dto'

@Controller('watering-programs')
export class WateringProgramsController {
  constructor(private readonly wateringProgramsService: WateringProgramsService) {}

  @Post()
  async create(@Body() createWateringProgramDto: CreateWateringProgramDto) {
    return this.wateringProgramsService.create(createWateringProgramDto)
  }

  @Get()
  async findAll() {
    return this.wateringProgramsService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.wateringProgramsService.findOne(id)
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateWateringProgramDto: UpdateWateringProgramDto
  ) {
    return this.wateringProgramsService.update(id, updateWateringProgramDto)
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.wateringProgramsService.remove(id)
  }
}

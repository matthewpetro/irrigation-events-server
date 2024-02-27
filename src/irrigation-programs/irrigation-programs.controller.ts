import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common'
import { IrrigationProgramsService } from './irrigation-programs.service'
import { CreateIrrigationProgramDto } from './dto/create-irrigation-program.dto'
import { UpdateIrrigationProgramDto } from './dto/update-irrigation-program.dto'

@Controller('irrigation-programs')
export class IrrigationProgramsController {
  constructor(private readonly irrigationProgramsService: IrrigationProgramsService) {}

  @Post()
  async create(@Body() createIrrigationProgramDto: CreateIrrigationProgramDto) {
    return this.irrigationProgramsService.create(createIrrigationProgramDto)
  }

  @Get()
  async findAll() {
    return this.irrigationProgramsService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.irrigationProgramsService.findOne(id)
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateIrrigationProgramDto: UpdateIrrigationProgramDto
  ) {
    return this.irrigationProgramsService.update(id, updateIrrigationProgramDto)
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.irrigationProgramsService.remove(id)
  }
}

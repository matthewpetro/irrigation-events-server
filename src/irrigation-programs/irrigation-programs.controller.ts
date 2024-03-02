import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common'
import { IrrigationProgramsService } from './irrigation-programs.service'
import type { CreateIrrigationProgram, UpdateIrrigationProgram } from './types'
import { IrrigationProgramDto } from './dto/irrigation-program.dto'
import { CreateIrrigationProgramDto } from './dto/create-irrigation-program.dto'
import { UpdateIrrigationProgramDto } from './dto/update-irrigation-program.dto'

@Controller('irrigation-programs')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class IrrigationProgramsController {
  constructor(private readonly irrigationProgramsService: IrrigationProgramsService) {}

  @Post()
  async create(@Body() createIrrigationProgramDto: CreateIrrigationProgramDto) {
    const result = await this.irrigationProgramsService.create(createIrrigationProgramDto as CreateIrrigationProgram)
    return result as IrrigationProgramDto
  }

  @Get()
  async findAll() {
    const result = await this.irrigationProgramsService.findAll()
    return result as IrrigationProgramDto[]
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const irrigationProgram = await this.irrigationProgramsService.findOne(id)
    return irrigationProgram as IrrigationProgramDto
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateIrrigationProgramDto: UpdateIrrigationProgramDto
  ) {
    const irrigationProgram = await this.irrigationProgramsService.update(
      id,
      updateIrrigationProgramDto as UpdateIrrigationProgram
    )
    return irrigationProgram as IrrigationProgramDto
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    await this.irrigationProgramsService.remove(id)
  }
}

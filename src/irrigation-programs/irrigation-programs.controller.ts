import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common'
import { IrrigationProgramsService } from './irrigation-programs.service'
import { CreateIrrigationProgramDto } from './dto/create-irrigation-program.dto'
import { UpdateIrrigationProgramDto } from './dto/update-irrigation-program.dto'

@Controller('irrigation-programs')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class IrrigationProgramsController {
  constructor(private readonly irrigationProgramsService: IrrigationProgramsService) {}

  @Post()
  async create(@Body() createIrrigationProgramDto: CreateIrrigationProgramDto) {
    const result = this.irrigationProgramsService.create(createIrrigationProgramDto)
    if (result === null) {
      throw new HttpException('Failed to create irrigation program', HttpStatus.INTERNAL_SERVER_ERROR)
    }
    return result
  }

  @Get()
  async findAll() {
    return this.irrigationProgramsService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const irrigationProgram = await this.irrigationProgramsService.findOne(id)
    if (irrigationProgram === null) {
      throw new HttpException(`Irrigation program with ID ${id} not found`, HttpStatus.NOT_FOUND)
    }
    return irrigationProgram
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateIrrigationProgramDto: UpdateIrrigationProgramDto
  ) {
    const irrigationProgram = this.irrigationProgramsService.update(id, updateIrrigationProgramDto)
    if (irrigationProgram === null) {
      throw new HttpException(`Irrigation program with ID ${id} not found`, HttpStatus.NOT_FOUND)
    }
    return irrigationProgram
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.irrigationProgramsService.remove(id)
  }
}

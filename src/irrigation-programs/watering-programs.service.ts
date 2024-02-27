import { Injectable, OnModuleInit } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { CreateIrrigationProgramDto } from './dto/create-watering-program.dto'
import { UpdateIrrigationProgramDto } from './dto/update-watering-program.dto'
import { IrrigationProgramDto } from './dto/watering-program.dto'
import { IrrigationProgram } from './entities/watering-program.entity'
import { ConfigService } from '@nestjs/config'
import EnvironmentVariables from '@/environment-variables'
import { DatabaseService } from '@/database/database.service'
import { DocumentScope } from 'nano'

@Injectable()
export class IrrigationProgramsService implements OnModuleInit {
  private db: DocumentScope<IrrigationProgram>

  public constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
    private databaseService: DatabaseService
  ) {}

  onModuleInit() {
    this.db = this.databaseService.getDatabaseConnection(
      this.configService.get<IrrigationProgram>('IRRIGATION_PROGRAMS_DB_NAME', { infer: true })
    )
  }

  async create(createIrrigationProgramDto: CreateIrrigationProgramDto) {
    return { id: uuidv4(), ...createIrrigationProgramDto } as IrrigationProgramDto
  }

  async findAll() {
    return [
      {
        id: uuidv4(),
        duration: 10,
        wateringPeriod: 2,
        startTime: '12:00:00Z',
        switches: [1, 2],
        simultaneousIrrigation: true,
      } as IrrigationProgramDto,
    ]
  }

  async findOne(id: string) {
    return {
      id,
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousIrrigation: true,
    } as IrrigationProgramDto
  }

  async update(id: string, updateIrrigationProgramDto: UpdateIrrigationProgramDto) {
    return {
      id,
      duration: updateIrrigationProgramDto.duration ?? 10,
      wateringPeriod: updateIrrigationProgramDto.wateringPeriod ?? 2,
      startTime: updateIrrigationProgramDto.startTime ?? '12:00:00Z',
      switches: updateIrrigationProgramDto.switches ?? [1, 2],
      simultaneousIrrigation: updateIrrigationProgramDto.simultaneousIrrigation ?? true,
    } as IrrigationProgramDto
  }

  async remove(id: string) {
    return {
      id,
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousIrrigation: true,
    } as IrrigationProgramDto
  }
}
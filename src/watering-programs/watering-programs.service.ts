import { Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { CreateWateringProgramDto } from './dto/create-watering-program.dto'
import { UpdateWateringProgramDto } from './dto/update-watering-program.dto'
import { WateringProgramDto } from './dto/watering-program.dto'

@Injectable()
export class WateringProgramsService {
  async create(createWateringProgramDto: CreateWateringProgramDto) {
    return { id: uuidv4(), ...createWateringProgramDto } as WateringProgramDto
  }

  async findAll() {
    return [
      {
        id: uuidv4(),
        duration: 10,
        wateringPeriod: 2,
        startTime: '12:00:00Z',
        switches: [1, 2],
        simultaneousWatering: true,
      } as WateringProgramDto,
    ]
  }

  async findOne(id: string) {
    return {
      id,
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousWatering: true,
    } as WateringProgramDto
  }

  async update(id: string, updateWateringProgramDto: UpdateWateringProgramDto) {
    return {
      id,
      duration: updateWateringProgramDto.duration ?? 10,
      wateringPeriod: updateWateringProgramDto.wateringPeriod ?? 2,
      startTime: updateWateringProgramDto.startTime ?? '12:00:00Z',
      switches: updateWateringProgramDto.switches ?? [1, 2],
      simultaneousWatering: updateWateringProgramDto.simultaneousWatering ?? true,
    } as WateringProgramDto
  }

  async remove(id: string) {
    return {
      id,
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousWatering: true,
    } as WateringProgramDto
  }
}

import { Injectable } from '@nestjs/common'
import { CreateWateringProgramDto } from './dto/create-watering-program.dto'
import { UpdateWateringProgramDto } from './dto/update-watering-program.dto'

@Injectable()
export class WateringProgramsService {
  create(createWateringProgramDto: CreateWateringProgramDto) {
    return 'This action adds a new wateringProgram'
  }

  findAll() {
    return `This action returns all wateringPrograms`
  }

  findOne(id: number) {
    return `This action returns a #${id} wateringProgram`
  }

  update(id: number, updateWateringProgramDto: UpdateWateringProgramDto) {
    return `This action updates a #${id} wateringProgram`
  }

  remove(id: number) {
    return `This action removes a #${id} wateringProgram`
  }
}

import { PartialType } from '@nestjs/mapped-types'
import { CreateIrrigationProgramDto } from './create-watering-program.dto'

export class UpdateIrrigationProgramDto extends PartialType(CreateIrrigationProgramDto) {}

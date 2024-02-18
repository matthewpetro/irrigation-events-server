import { PartialType } from '@nestjs/mapped-types'
import { CreateWateringProgramDto } from './create-watering-program.dto'

export class UpdateWateringProgramDto extends PartialType(CreateWateringProgramDto) {}

import { PartialType } from '@nestjs/mapped-types'
import { CreateIrrigationProgramDto } from './create-irrigation-program.dto'

export class UpdateIrrigationProgramDto extends PartialType(CreateIrrigationProgramDto) {}

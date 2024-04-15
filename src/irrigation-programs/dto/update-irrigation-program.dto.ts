import { PartialType } from '@nestjs/swagger'
import { CreateIrrigationProgramDto } from './create-irrigation-program.dto'

export class UpdateIrrigationProgramDto extends PartialType(CreateIrrigationProgramDto) {}

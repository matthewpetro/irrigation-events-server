import { IsUUID } from 'class-validator'
import { CreateIrrigationProgramDto } from './create-watering-program.dto'

export class IrrigationProgramDto extends CreateIrrigationProgramDto {
  @IsUUID('4')
  id: string
}
import { IsUUID } from 'class-validator'
import { CreateWateringProgramDto } from './create-watering-program.dto'

export class WateringProgramDto extends CreateWateringProgramDto {
  @IsUUID('4')
  id: string
}

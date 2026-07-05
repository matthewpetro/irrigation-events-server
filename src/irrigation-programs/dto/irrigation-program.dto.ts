import { IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { CreateIrrigationProgramDto } from './create-irrigation-program.dto'

export class IrrigationProgramDto extends CreateIrrigationProgramDto {
  @ApiProperty()
  @IsUUID('4')
  readonly id!: string
}

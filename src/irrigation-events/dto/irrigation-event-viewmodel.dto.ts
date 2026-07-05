import { IsISO8601, IsInt, IsPositive, MaxDate } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Warning } from '../enums/warning.enum'

export class IrrigationEventViewmodelDto {
  @ApiProperty({ format: 'date-time', required: false })
  @IsISO8601()
  @MaxDate(new Date())
  readonly startTimestamp?: string

  @ApiProperty({ format: 'date-time', required: false })
  @IsISO8601()
  @MaxDate(new Date())
  readonly endTimestamp?: string

  @ApiProperty()
  readonly title!: string

  @ApiProperty()
  @IsInt()
  @IsPositive()
  readonly deviceId!: number

  @ApiProperty({ enum: Warning, required: false })
  readonly warning?: Warning

  @ApiProperty({ required: false })
  readonly currentlyOn?: boolean
}

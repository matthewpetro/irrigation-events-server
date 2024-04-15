import { IsISO8601, IsInt, IsPositive, MaxDate } from 'class-validator'
import { Warning } from '../enums/warning.enum'

export class IrrigationEventViewmodelDto {
  @IsISO8601()
  @MaxDate(new Date())
  readonly startTimestamp: string

  @IsISO8601()
  @MaxDate(new Date())
  readonly endTimestamp?: string

  readonly title: string

  @IsInt()
  @IsPositive()
  readonly deviceId: number

  readonly warning?: Warning

  readonly currentlyOn?: boolean
}

import { IsBoolean, IsISO8601, IsInt, IsOptional, IsPositive, Length, Matches, MinDate } from 'class-validator'
import { startOfToday } from 'date-fns'
import { DeviceId } from '@/types'

export class CreateIrrigationProgramDto {
  @Length(1, 255)
  readonly name: string

  @IsInt()
  @IsPositive()
  readonly duration: number

  @IsInt()
  @IsPositive()
  readonly wateringPeriod: number

  // Matches a time formatted in HH24:MM or a string containing 'sunset' or 'sunrise' followed by an optional offset
  // Examples:
  //   05:30
  //   22:15
  //   sunrise+60
  //   sunset-30
  @Matches(/^(?:[01]\d|2[0-3]):(?:[0-5]\d)$|^(?:sunset|sunrise)(?:[+-]?\d+)?$/, { each: true })
  readonly startTimes: string[]

  @IsInt({ each: true })
  @IsPositive({ each: true })
  readonly deviceIds: DeviceId[]

  @IsBoolean()
  readonly simultaneousIrrigation: boolean

  @IsISO8601()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsOptional()
  @MinDate(startOfToday())
  readonly nextRunDate?: string | null
}

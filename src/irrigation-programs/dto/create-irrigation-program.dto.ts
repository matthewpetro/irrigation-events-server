import { IsBoolean, IsISO8601, IsInt, IsOptional, IsPositive, Length, Matches, MinDate } from 'class-validator'
import { DeviceId } from '@/types'
import { startOfToday } from 'date-fns'

export class CreateIrrigationProgramDto {
  @Length(1, 255)
  name: string

  @IsInt()
  @IsPositive()
  duration: number

  @IsInt()
  @IsPositive()
  wateringPeriod: number

  // Matches a time formatted in HH24:MM or a string containing 'sunset' or 'sunrise' followed by an optional offset
  // Examples:
  //   05:30
  //   22:15
  //   sunrise+60
  //   sunset-30
  @Matches(/^(?:[01]\d|2[0-3]):(?:[0-5]\d)$|^(?:sunset|sunrise)(?:[+-]?\d+)?$/)
  startTime: string

  @IsInt({ each: true })
  @IsPositive({ each: true })
  deviceIds: DeviceId[]

  @IsBoolean()
  simultaneousIrrigation: boolean

  @IsISO8601()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsOptional()
  @MinDate(startOfToday())
  nextRunDate?: string
}

import { IsBoolean, IsISO8601, IsInt, IsOptional, IsPositive, Length, Matches, MinDate } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { startOfToday } from 'date-fns'
import { DeviceId } from '@/types'

export class CreateIrrigationProgramDto {
  @ApiProperty()
  @Length(1, 255)
  readonly name!: string

  @ApiProperty()
  @IsInt()
  @IsPositive()
  readonly duration!: number

  @ApiProperty()
  @IsInt()
  @IsPositive()
  readonly wateringPeriod!: number

  // Matches a time formatted in HH24:MM or a string containing 'sunset' or 'sunrise' followed by an optional offset
  // Examples:
  //   05:30
  //   22:15
  //   sunrise+60
  //   sunset-30
  @ApiProperty({ type: [String] })
  @Matches(/^(?:[01]\d|2[0-3]):(?:[0-5]\d)$|^(?:sunset|sunrise)(?:[+-]?\d+)?$/, { each: true })
  readonly startTimes!: string[]

  @ApiProperty({ type: [Number] })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  readonly deviceIds!: DeviceId[]

  @ApiProperty()
  @IsBoolean()
  readonly simultaneousIrrigation!: boolean

  @ApiProperty({ type: String, nullable: true, pattern: '/^\\d{4}-\\d{2}-\\d{2}$/', required: false })
  @IsISO8601()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsOptional()
  @MinDate(startOfToday())
  readonly nextRunDate?: string | null
}

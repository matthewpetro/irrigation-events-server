import { IsISO8601, Matches, MinDate } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { startOfToday } from 'date-fns'

export class RainDelayDto {
  constructor(resumeWateringAfterDate: string | null = null) {
    this.resumeWateringAfterDate = resumeWateringAfterDate
  }

  @ApiProperty({ type: String, nullable: true, pattern: '/^\\d{4}-\\d{2}-\\d{2}$/' })
  @IsISO8601()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @MinDate(startOfToday())
  readonly resumeWateringAfterDate: string | null
}

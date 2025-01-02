import { IsISO8601, Matches, MinDate } from 'class-validator'
import { startOfToday } from 'date-fns'

export class RainDelayDto {
  constructor(resumeWateringAfterDate: string | null = null) {
    this.resumeWateringAfterDate = resumeWateringAfterDate
  }

  @IsISO8601()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @MinDate(startOfToday())
  readonly resumeWateringAfterDate: string | null
}

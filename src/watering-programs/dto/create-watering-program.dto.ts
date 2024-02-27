import { IsBoolean, IsISO8601, IsInt, IsPositive, Matches } from 'class-validator'

export class CreateIrrigationProgramDto {
  @IsInt()
  @IsPositive()
  duration: number

  @IsInt()
  @IsPositive()
  wateringPeriod: number

  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  startTime: string

  @IsInt({ each: true })
  @IsPositive({ each: true })
  switches: number[]

  @IsBoolean()
  simultaneousIrrigation: boolean

  @IsISO8601()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  nextRunDate?: string
}

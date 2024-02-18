export class CreateWateringProgramDto {
  duration: number
  wateringPeriod: number
  startTime: string
  switches: number[]
  simultaneousWatering: boolean
  nextRunDate?: string
}

export interface IrrigationProgramEntity {
  duration: number
  wateringPeriod: number
  startTime: string
  switches: number[]
  simultaneousIrrigation: boolean
  nextRunDate?: string
}

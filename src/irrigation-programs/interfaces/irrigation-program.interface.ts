export interface IrrigationProgram {
  id: string
  duration: number
  wateringPeriod: number
  startTime: string
  switches: number[]
  simultaneousIrrigation: boolean
  nextRunDate?: string
}

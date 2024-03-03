export interface IrrigationProgram {
  id: string
  name: string
  duration: number
  wateringPeriod: number
  startTime: string
  deviceIds: number[]
  simultaneousIrrigation: boolean
  nextRunDate?: string
}

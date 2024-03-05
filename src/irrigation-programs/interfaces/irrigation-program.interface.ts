import { DeviceId } from '@/types'

export interface IrrigationProgram {
  id: string
  name: string
  duration: number
  wateringPeriod: number
  startTime: string
  deviceIds: DeviceId[]
  simultaneousIrrigation: boolean
  nextRunDate?: string
}

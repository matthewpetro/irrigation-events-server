import { DeviceId } from '@/types'
import { DeviceInterval } from './device-interval.interface'

export interface IrrigationProgram {
  id: string
  name: string
  duration: number
  wateringPeriod: number
  startTime: string
  deviceIds: DeviceId[]
  simultaneousIrrigation: boolean
  nextRunDate?: string | null
  deviceIntervals?: DeviceInterval[] | null
}

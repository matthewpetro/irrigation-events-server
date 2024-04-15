import { Interval } from 'date-fns'
import { DeviceId } from '@/types'

export interface DeviceInterval {
  deviceId: DeviceId
  interval: Interval
}

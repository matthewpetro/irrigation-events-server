import { DeviceId } from '@/types'
import { Interval } from 'date-fns'

export interface DeviceInterval {
  deviceId: DeviceId
  interval: Interval
}

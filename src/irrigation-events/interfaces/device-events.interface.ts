import { DeviceState } from '@/enums/device-state.interface'
import { IrrigationEvent } from './irrigation-event.interface'

export interface DeviceEvents {
  deviceId: number
  events: IrrigationEvent[]
  currentDeviceState?: DeviceState
}

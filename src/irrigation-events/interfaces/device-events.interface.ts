import { DeviceState } from '@/enums/device-state.enum'
import { IrrigationEvent } from './irrigation-event.interface'

export interface DeviceEvents {
  deviceId: number
  events: IrrigationEvent[]
  currentDeviceState?: DeviceState
}

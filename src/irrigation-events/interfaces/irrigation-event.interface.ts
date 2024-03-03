import { DeviceState } from '@/enums/device-state.interface'

export interface IrrigationEvent {
  timestamp: Date
  deviceName: string
  deviceId: number
  state: DeviceState
}

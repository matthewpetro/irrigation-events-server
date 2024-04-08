import { DeviceState } from '@/enums/device-state.enum'

export interface IrrigationEvent {
  timestamp: Date
  deviceName: string
  deviceId: number
  state: DeviceState
}

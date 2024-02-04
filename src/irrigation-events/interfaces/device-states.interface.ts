import { DeviceState } from '../enums/device-state.interface'

export interface DeviceStates {
  [deviceId: string]: DeviceState | undefined
}

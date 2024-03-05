import { DeviceState } from '@/enums/device-state.interface'
import { DeviceId } from '@/types'

export interface DeviceStates {
  [deviceId: DeviceId]: DeviceState
}

import { DeviceState } from '@/enums/device-state.enum'
import { DeviceId } from '@/types'

export interface DeviceStates {
  [deviceId: DeviceId]: DeviceState
}

import { IdentifiedDocument } from 'nano'
import { DeviceState } from '../enums/device-state.interface'

export interface IrrigationEventDocument extends IdentifiedDocument {
  deviceName: string
  deviceId: number
  state: DeviceState
}

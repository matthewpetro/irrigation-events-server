import { MaybeDocument } from 'nano'
import { DeviceState } from '../enums/device-state.interface'

export interface IrrigationEventDocument extends MaybeDocument {
  _id: string
  deviceName: string
  deviceId: number
  state: DeviceState
}

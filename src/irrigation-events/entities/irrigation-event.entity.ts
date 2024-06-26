import { IdentifiedDocument } from 'nano'
import { DeviceState } from '@/enums/device-state.enum'

export class IrrigationEventDocument implements IdentifiedDocument {
  _id: string

  deviceName: string

  deviceId: number

  state: DeviceState
}

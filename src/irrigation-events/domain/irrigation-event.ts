import { parseISO } from 'date-fns'
import { DeviceState } from '../enums/device-state.interface'
import { IrrigationEventDocument } from '../interfaces/irrigation-event-document.interface'

export class IrrigationEvent {
  private timestamp: Date
  private deviceName: string
  private deviceId: number
  private state: DeviceState

  constructor({ _id, deviceName, deviceId, state }: IrrigationEventDocument) {
    this.timestamp = parseISO(_id)
    this.deviceName = deviceName
    this.deviceId = deviceId
    this.state = state
  }

  getTimestamp(): Date {
    return new Date(this.timestamp)
  }

  getDeviceName(): string {
    return this.deviceName
  }

  getDeviceId(): number {
    return this.deviceId
  }

  getState(): DeviceState {
    return this.state
  }
}

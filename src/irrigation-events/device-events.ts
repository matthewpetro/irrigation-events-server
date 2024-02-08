import { compareAsc, parseISO } from 'date-fns'
import { IrrigationEventDocument } from './interfaces/irrigation-event-document.interface'
import { DeviceState } from './enums/device-state.interface'

const sortFn = (a: IrrigationEventDocument, b: IrrigationEventDocument) => compareAsc(parseISO(a._id), parseISO(b._id))

export class DeviceEvents {
  private deviceId: number
  private events: IrrigationEventDocument[] = []
  private currentDeviceState?: DeviceState

  constructor(deviceId: number, events: IrrigationEventDocument[]) {
    this.deviceId = deviceId
    this.events = [...events].sort(sortFn)
  }

  public getDeviceId(): number {
    return this.deviceId
  }

  public getEvents(): IrrigationEventDocument[] {
    return [...this.events]
  }

  public getFirstEvent(): IrrigationEventDocument {
    return this.events[0]
  }

  public getLastEvent(): IrrigationEventDocument {
    return this.events[this.events.length - 1]
  }

  public setCurrentDeviceState(state: DeviceState | undefined) {
    this.currentDeviceState = state
  }

  public getCurrentDeviceState(): DeviceState | undefined {
    return this.currentDeviceState
  }

  public addEvent(event: IrrigationEventDocument) {
    this.events.push(event)
    this.events.sort(sortFn)
  }
}

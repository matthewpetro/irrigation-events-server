import { compareAsc } from 'date-fns'
import { IrrigationEvent } from '../interfaces/irrigation-event.interface'
import { DeviceState } from '../enums/device-state.interface'

const sortFn = (a: IrrigationEvent, b: IrrigationEvent) => compareAsc(a.timestamp, b.timestamp)

export class DeviceEvents {
  private deviceId: number
  private events: IrrigationEvent[] = []
  private currentDeviceState?: DeviceState

  constructor(deviceId: number, events: IrrigationEvent[]) {
    this.deviceId = deviceId
    this.events = [...events].sort(sortFn)
  }

  public getDeviceId(): number {
    return this.deviceId
  }

  public getEvents(): IrrigationEvent[] {
    return [...this.events]
  }

  public getFirstEvent(): IrrigationEvent {
    return this.events[0]
  }

  public getLastEvent(): IrrigationEvent {
    return this.events[this.events.length - 1]
  }

  public setCurrentDeviceState(state: DeviceState | undefined) {
    this.currentDeviceState = state
  }

  public getCurrentDeviceState(): DeviceState | undefined {
    return this.currentDeviceState
  }

  public addEvent(event: IrrigationEvent) {
    this.events.push(event)
    this.events.sort(sortFn)
  }
}

import { Injectable } from '@nestjs/common'
import { roundToNearestMinutes } from 'date-fns'
import { IrrigationEventViewmodel } from './dto/irrigation-event-viewmodel.dto'
import { DeviceState } from './enums/device-state.interface'
import { Warning } from './enums/warning.interface'
import { DeviceEvents } from './domain/device-events'

const convertTimestampToViewmodel = (timestamp: Date): string =>
  roundToNearestMinutes(timestamp, {
    nearestTo: 1,
    roundingMethod: 'trunc',
  }).toISOString()

function createViewmodelsFromDeviceEvents(deviceEvents: DeviceEvents): IrrigationEventViewmodel[] {
  const viewmodels: IrrigationEventViewmodel[] = []
  const events = deviceEvents.getEvents()
  let i = 0
  while (i < events.length) {
    const [event, nextEvent] = events.slice(i, i + 2)
    if (event.state === DeviceState.ON && nextEvent?.state === DeviceState.OFF) {
      // Happy path: ON followed by OFF
      viewmodels.push({
        startDate: convertTimestampToViewmodel(event.timestamp),
        endDate: convertTimestampToViewmodel(nextEvent.timestamp),
        title: event.deviceName,
        deviceId: event.deviceId,
      })
      i += 2
    } else if (event.state === DeviceState.ON && nextEvent?.state === DeviceState.ON) {
      // ON followed by ON means an OFF event is missing
      viewmodels.push({
        startDate: convertTimestampToViewmodel(event.timestamp),
        title: event.deviceName,
        deviceId: event.deviceId,
        warning: Warning.MISSING_OFF,
      })
      i += 1
    } else if (event.state === DeviceState.ON && !nextEvent) {
      // ON followed by nothing means the device is currently on or
      // the final OFF event is missing. Check the current device
      // states to determine which is the case.
      viewmodels.push(
        deviceEvents.getCurrentDeviceState() === DeviceState.ON
          ? {
              startDate: convertTimestampToViewmodel(event.timestamp),
              endDate: convertTimestampToViewmodel(new Date()),
              title: event.deviceName,
              deviceId: event.deviceId,
              currentlyOn: true,
            }
          : {
              startDate: convertTimestampToViewmodel(event.timestamp),
              title: event.deviceName,
              deviceId: event.deviceId,
              warning: Warning.MISSING_OFF,
            }
      )
      i += 1
    } else if (event.state === DeviceState.OFF) {
      // OFF means an ON event is missing
      viewmodels.push({
        startDate: convertTimestampToViewmodel(event.timestamp),
        title: event.deviceName,
        deviceId: event.deviceId,
        warning: Warning.MISSING_ON,
      })
      i += 1
    }
  }
  return viewmodels
}

@Injectable()
export class ViewmodelTransformService {
  public transform(deviceEventsList: DeviceEvents[]): IrrigationEventViewmodel[] {
    return deviceEventsList.flatMap((deviceEvents) => createViewmodelsFromDeviceEvents(deviceEvents))
  }
}

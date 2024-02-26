import { Injectable } from '@nestjs/common'
import { compareAsc, roundToNearestMinutes } from 'date-fns'
import { IrrigationEventViewmodel } from './dto/irrigation-event-viewmodel.dto'
import { DeviceState } from './enums/device-state.interface'
import { Warning } from './enums/warning.interface'
import { DeviceEvents } from './interfaces/device-events.interface'

const convertTimestampToViewmodel = (timestamp: Parameters<typeof roundToNearestMinutes>[0]): string =>
  roundToNearestMinutes(timestamp, {
    nearestTo: 1,
    roundingMethod: 'trunc',
  }).toISOString()

function createViewmodelsFromDeviceEvents({ events, currentDeviceState }: DeviceEvents): IrrigationEventViewmodel[] {
  const sortedEvents = [...events].sort((a, b) => compareAsc(a.timestamp, b.timestamp))
  const viewmodels: IrrigationEventViewmodel[] = []
  let i = 0
  while (i < sortedEvents.length) {
    const [event, nextEvent] = sortedEvents.slice(i, i + 2)
    if (event.state === DeviceState.ON && nextEvent?.state === DeviceState.OFF) {
      // Happy path: ON followed by OFF
      viewmodels.push({
        startTimestamp: convertTimestampToViewmodel(event.timestamp),
        endTimestamp: convertTimestampToViewmodel(nextEvent.timestamp),
        title: event.deviceName,
        deviceId: event.deviceId,
      })
      i += 2
    } else if (event.state === DeviceState.ON && nextEvent?.state === DeviceState.ON) {
      // ON followed by ON means an OFF event is missing
      viewmodels.push({
        startTimestamp: convertTimestampToViewmodel(event.timestamp),
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
        currentDeviceState === DeviceState.ON
          ? {
              startTimestamp: convertTimestampToViewmodel(event.timestamp),
              endTimestamp: convertTimestampToViewmodel(Date.now()),
              title: event.deviceName,
              deviceId: event.deviceId,
              currentlyOn: true,
            }
          : {
              startTimestamp: convertTimestampToViewmodel(event.timestamp),
              title: event.deviceName,
              deviceId: event.deviceId,
              warning: Warning.MISSING_OFF,
            }
      )
      i += 1
    } else if (event.state === DeviceState.OFF) {
      // OFF means an ON event is missing
      viewmodels.push({
        startTimestamp: convertTimestampToViewmodel(event.timestamp),
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

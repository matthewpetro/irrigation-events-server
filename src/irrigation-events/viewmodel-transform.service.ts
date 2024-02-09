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
    if (event.getState() === DeviceState.ON && nextEvent?.getState() === DeviceState.OFF) {
      // Happy path: ON followed by OFF
      viewmodels.push({
        // eslint-disable-next-line no-underscore-dangle
        startDate: convertTimestampToViewmodel(event.getTimestamp()),
        // eslint-disable-next-line no-underscore-dangle
        endDate: convertTimestampToViewmodel(nextEvent.getTimestamp()),
        title: event.getDeviceName(),
        deviceId: event.getDeviceId(),
      })
      i += 2
    } else if (event.getState() === DeviceState.ON && nextEvent?.getState() === DeviceState.ON) {
      // ON followed by ON means an OFF event is missing
      viewmodels.push({
        // eslint-disable-next-line no-underscore-dangle
        startDate: convertTimestampToViewmodel(event.getTimestamp()),
        title: event.getDeviceName(),
        deviceId: event.getDeviceId(),
        warning: Warning.MISSING_OFF,
      })
      i += 1
    } else if (event.getState() === DeviceState.ON && !nextEvent) {
      // ON followed by nothing means the device is currently on or
      // the final OFF event is missing. Check the current device
      // states to determine which is the case.
      viewmodels.push(
        deviceEvents.getCurrentDeviceState() === DeviceState.ON
          ? {
              // eslint-disable-next-line no-underscore-dangle
              startDate: convertTimestampToViewmodel(event.getTimestamp()),
              endDate: convertTimestampToViewmodel(new Date()),
              title: event.getDeviceName(),
              deviceId: event.getDeviceId(),
              currentlyOn: true,
            }
          : {
              // eslint-disable-next-line no-underscore-dangle
              startDate: convertTimestampToViewmodel(event.getTimestamp()),
              title: event.getDeviceName(),
              deviceId: event.getDeviceId(),
              warning: Warning.MISSING_OFF,
            }
      )
      i += 1
    } else if (event.getState() === DeviceState.OFF) {
      // OFF means an ON event is missing
      viewmodels.push({
        // eslint-disable-next-line no-underscore-dangle
        startDate: convertTimestampToViewmodel(event.getTimestamp()),
        title: event.getDeviceName(),
        deviceId: event.getDeviceId(),
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

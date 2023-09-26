import { roundToNearestMinutes } from 'date-fns'
import {
  DeviceState,
  IrrigationEventDocument,
  IrrigationEventViewModel,
  Warning,
} from '../types.js'

const roundTimestampToMinute = (timestamp: string): string =>
  roundToNearestMinutes(new Date(timestamp), {
    nearestTo: 1,
    roundingMethod: 'trunc',
  }).toISOString()

function createViewmodelsFromDeviceEvents(
  deviceEvents: IrrigationEventDocument[]
): IrrigationEventViewModel[] {
  const viewmodels: IrrigationEventViewModel[] = []
  let i = 0
  while (i < deviceEvents.length) {
    const [event, nextEvent] = deviceEvents.slice(i, i + 2)
    if (event.state === DeviceState.ON && nextEvent?.state === DeviceState.OFF) {
      // Happy path: ON followed by OFF
      viewmodels.push({
        // eslint-disable-next-line no-underscore-dangle
        startDate: roundTimestampToMinute(event._id),
        // eslint-disable-next-line no-underscore-dangle
        endDate: roundTimestampToMinute(nextEvent._id),
        title: event.deviceName,
        deviceId: event.deviceId,
      })
      i += 2
    } else if (event.state === DeviceState.ON && nextEvent?.state === DeviceState.ON) {
      // ON followed by ON means an OFF event is missing
      viewmodels.push({
        // eslint-disable-next-line no-underscore-dangle
        startDate: roundTimestampToMinute(event._id),
        title: event.deviceName,
        deviceId: event.deviceId,
        warning: Warning.MISSING_OFF,
      })
      i += 1
    } else if (event.state === DeviceState.ON && !nextEvent) {
      // ON followed by nothing probably means the device is currently on.
      // It may also mean that the final OFF event is missing, but
      // it's more likely that the device is still on.
      viewmodels.push({
        // eslint-disable-next-line no-underscore-dangle
        startDate: roundTimestampToMinute(event._id),
        title: event.deviceName,
        deviceId: event.deviceId,
        warning: Warning.CURRENTLY_ON,
      })
      i += 1
    } else if (event.state === DeviceState.OFF) {
      // OFF means an ON event is missing
      viewmodels.push({
        // eslint-disable-next-line no-underscore-dangle
        startDate: roundTimestampToMinute(event._id),
        title: event.deviceName,
        deviceId: event.deviceId,
        warning: Warning.MISSING_ON,
      })
      i += 1
    }
  }
  return viewmodels
}

const builder = (eventLists: IrrigationEventDocument[][]): IrrigationEventViewModel[] =>
  eventLists.flatMap((deviceEvents) => createViewmodelsFromDeviceEvents(deviceEvents))

export default builder

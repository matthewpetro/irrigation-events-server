import { roundToNearestMinutes } from 'date-fns'
import {
  DeviceState,
  IrrigationEventDocument,
  IrrigationEventViewModel,
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
      })
      i += 1
    } else if (event.state === DeviceState.ON && !nextEvent) {
      // ON followed by nothing means the final OFF event is missing
      // or the device is still on
      // TODO: handle this situation better
      // Maybe check to see if the current time is within the
      // time range being searched for? If so, assume the device
      // is still on, if not, assume the final OFF event is missing
      // and do something to indicate that.
      viewmodels.push({
        // eslint-disable-next-line no-underscore-dangle
        startDate: roundTimestampToMinute(event._id),
        title: event.deviceName,
        deviceId: event.deviceId,
      })
      i += 1
    } else if (event.state === DeviceState.OFF) {
      // OFF means an ON event is missing
      viewmodels.push({
        // eslint-disable-next-line no-underscore-dangle
        endDate: roundTimestampToMinute(event._id),
        title: event.deviceName,
        deviceId: event.deviceId,
      })
      i += 1
    }
  }
  return viewmodels
}

const builder = (eventLists: IrrigationEventDocument[][]): IrrigationEventViewModel[] =>
  eventLists.flatMap((deviceEvents) => createViewmodelsFromDeviceEvents(deviceEvents))

export default builder

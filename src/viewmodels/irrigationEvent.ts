import { roundToNearestMinutes } from 'date-fns'
import {
  DeviceState,
  IrrigationEventDocument,
  IrrigationEventViewModel,
  Warning,
} from '../types.js'
import type { DeviceStates } from '../types.js'

const roundTimestampToMinute = (timestamp: string): string =>
  roundToNearestMinutes(new Date(timestamp), {
    nearestTo: 1,
    roundingMethod: 'trunc',
  }).toISOString()

function createViewmodelsFromDeviceEvents(
  deviceEvents: IrrigationEventDocument[],
  deviceStates: DeviceStates
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
      // ON followed by nothing means the device is currently on or
      // the final OFF event is missing. Check the current device
      // states to determine which is the case.
      const currentState = deviceStates[event.deviceId.toString()]
      viewmodels.push({
        // eslint-disable-next-line no-underscore-dangle
        startDate: roundTimestampToMinute(event._id),
        title: event.deviceName,
        deviceId: event.deviceId,
        warning: currentState !== DeviceState.ON ? Warning.MISSING_OFF : undefined,
        currentlyOn: currentState === DeviceState.ON,
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

const builder = (
  eventLists: IrrigationEventDocument[][],
  deviceStates: DeviceStates
): IrrigationEventViewModel[] =>
  eventLists.flatMap((deviceEvents) => createViewmodelsFromDeviceEvents(deviceEvents, deviceStates))

export default builder

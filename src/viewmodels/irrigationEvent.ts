import { roundToNearestMinutes } from "date-fns"
import { DeviceState, IrrigationEventDocument } from "../types.js"

// Conforms to AppointmentModel from @devexpress/dx-react-scheduler
export type IrrigationEventViewModel = {
  startDate: string
  endDate: string
  title: string
  deviceId: number
}

const getOnOffPairsForDevice = (events: IrrigationEventDocument[], id: number): IrrigationEventDocument[][] => {
  const onEvents = events.filter(
    ({ deviceId, state }) => deviceId === id && state === DeviceState.ON
  )
  const offEvents = events.filter(
    ({ deviceId, state }) => deviceId === id && state === DeviceState.OFF
  )
  if (onEvents.length === 0 || offEvents.length === 0) {
    console.info(`No events found for device ID ${id}`)
    return []
  }
  if (onEvents.length !== offEvents.length) {
    console.error(
      `Number of ON events does not match number of OFF events for device ${onEvents[0].deviceName}, ID ${id}`
    )
    return []
  }
  const onOffPairs: IrrigationEventDocument[][] = []
  for (let i = 0; i < onEvents.length; i += 1) {
    onOffPairs.push([onEvents[i], offEvents[i]])
  }
  return onOffPairs
}

const roundTimestampToMinute = (timestamp: string): string => 
  roundToNearestMinutes(new Date(timestamp), { nearestTo: 1, roundingMethod: 'trunc' }).toISOString()

const builder = (dbDocuments: IrrigationEventDocument[]) => {
  const uniqueDeviceIds = dbDocuments.reduce((accumulator, event) => accumulator.add(event.deviceId), new Set<number>())
  const viewModel: IrrigationEventViewModel[] = []
  uniqueDeviceIds.forEach((deviceId) => {
    const onOffPairs = getOnOffPairsForDevice(dbDocuments, deviceId)
    const events = onOffPairs.map(
      ([onEvent, offEvent]: IrrigationEventDocument[]): IrrigationEventViewModel => ({
        title: `${onEvent.deviceName}`,
        // eslint-disable-next-line no-underscore-dangle
        startDate: roundTimestampToMinute(onEvent._id),
        // eslint-disable-next-line no-underscore-dangle
        endDate: roundTimestampToMinute(offEvent._id),
        deviceId
      })
    )
    viewModel.push(...events)
  })
  return viewModel
}

export default builder
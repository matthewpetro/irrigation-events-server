import { MaybeDocument } from 'nano'

const DeviceState = {
  ON: 'on',
  OFF: 'off',
} as const

// eslint-disable-next-line @typescript-eslint/no-redeclare
type DeviceState = (typeof DeviceState)[keyof typeof DeviceState]

interface IrrigationEventDocument extends MaybeDocument {
  _id: string
  deviceName: string
  deviceId: number
  state: DeviceState
}

type IrrigationEvent = {
  timestamp: string
  deviceName: string
  deviceId: number
  state: DeviceState
}

// Conforms to AppointmentModel from @devexpress/dx-react-scheduler
export type IrrigationEventViewModel = {
  startDate?: string
  endDate?: string
  title: string
  deviceId: number
}

export { DeviceState, IrrigationEventDocument, IrrigationEvent }
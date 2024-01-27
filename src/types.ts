import { MaybeDocument } from 'nano'

const DeviceState = {
  ON: 'on',
  OFF: 'off',
} as const

// eslint-disable-next-line @typescript-eslint/no-redeclare
type DeviceState = (typeof DeviceState)[keyof typeof DeviceState]

type DeviceStates = {
  [deviceId: string]: DeviceState | undefined
}

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

const Warning = {
  MISSING_ON: 'The ON event is missing. The time shown is the OFF time.',
  MISSING_OFF: 'The OFF event is missing. The time shown is the ON time.',
} as const

// eslint-disable-next-line @typescript-eslint/no-redeclare
type Warning = (typeof Warning)[keyof typeof Warning]

// Conforms to AppointmentModel from @devexpress/dx-react-scheduler
export type IrrigationEventViewModel = {
  startDate?: string
  endDate?: string
  title: string
  deviceId: number
  warning?: Warning
  currentlyOn?: boolean
  allDay?: boolean
}

interface DatabaseFunctions {
  insertIrrigationEvent: (irrigationEvent: IrrigationEventDocument) => Promise<void>
  getIrrigationEvents: (startTimestamp: string, endTimestamp: string) => Promise<IrrigationEventDocument[]>
  getEventsBeforeStart: (startTimestamp: string, deviceId: number) => Promise<IrrigationEventDocument[]>
  getEventsAfterEnd: (endTimestamp: string, deviceId: number) => Promise<IrrigationEventDocument[]>
}

export { DatabaseFunctions, DeviceState, DeviceStates, IrrigationEventDocument, IrrigationEvent, Warning }

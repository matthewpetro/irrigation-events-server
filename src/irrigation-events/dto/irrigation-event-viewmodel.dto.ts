import { Warning } from '../enums/warning.interface'

export interface IrrigationEventViewmodel {
  startTimestamp: string
  endTimestamp?: string
  title: string
  deviceId: number
  warning?: Warning
  currentlyOn?: boolean
}

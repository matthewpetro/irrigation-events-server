import { Warning } from '../enums/warning.interface'

// Conforms to AppointmentModel from @devexpress/dx-react-scheduler
export interface IrrigationEventViewmodel {
  startDate?: string
  endDate?: string
  title: string
  deviceId: number
  warning?: Warning
  currentlyOn?: boolean
  allDay?: boolean
}

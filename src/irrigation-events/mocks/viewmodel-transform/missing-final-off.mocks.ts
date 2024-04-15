import { IrrigationEvent } from '../../interfaces/irrigation-event.interface'
import { DeviceState } from '@/enums/device-state.enum'
import { Warning } from '../../enums/warning.enum'
import { DeviceEvents } from '../../interfaces/device-events.interface'
import { IrrigationEventViewmodelDto } from '../../dto/irrigation-event-viewmodel.dto'

const deviceIrrigationEvents: IrrigationEvent[] = [
  {
    timestamp: new Date('2024-01-01T12:00:00Z'),
    deviceName: 'Device 1',
    deviceId: 1,
    state: DeviceState.ON,
  },
  {
    timestamp: new Date('2024-01-01T13:00:00Z'),
    deviceName: 'Device 1',
    deviceId: 1,
    state: DeviceState.OFF,
  },
  {
    timestamp: new Date('2024-01-02T12:00:00Z'),
    deviceName: 'Device 1',
    deviceId: 1,
    state: DeviceState.ON,
  },
  {
    timestamp: new Date('2024-01-02T12:30:00Z'),
    deviceName: 'Device 1',
    deviceId: 1,
    state: DeviceState.OFF,
  },
  {
    timestamp: new Date('2024-01-03T14:00:00Z'),
    deviceName: 'Device 1',
    deviceId: 1,
    state: DeviceState.ON,
  },
]

const deviceEvents = {
  deviceId: 1,
  events: deviceIrrigationEvents,
  currentDeviceState: DeviceState.OFF,
} as DeviceEvents

const resultViewmodels: IrrigationEventViewmodelDto[] = [
  {
    startTimestamp: '2024-01-01T12:00:00.000Z',
    endTimestamp: '2024-01-01T13:00:00.000Z',
    title: 'Device 1',
    deviceId: 1,
  },
  {
    startTimestamp: '2024-01-02T12:00:00.000Z',
    endTimestamp: '2024-01-02T12:30:00.000Z',
    title: 'Device 1',
    deviceId: 1,
  },
  {
    startTimestamp: '2024-01-03T14:00:00.000Z',
    title: 'Device 1',
    deviceId: 1,
    warning: Warning.MISSING_OFF,
  },
]

export { deviceEvents, resultViewmodels }

import { IrrigationEvent } from '../../interfaces/irrigation-event.interface'
import { DeviceState } from '../../enums/device-state.interface'
import { Warning } from '../../enums/warning.interface'
import { DeviceEvents } from '../../interfaces/device-events.interface'
import { IrrigationEventViewmodel } from '../../dto/irrigation-event-viewmodel.dto'

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

const deviceEvents = { deviceId: 1, events: deviceIrrigationEvents } as DeviceEvents

const resultViewmodels: IrrigationEventViewmodel[] = [
  {
    startDate: '2024-01-01T12:00:00.000Z',
    endDate: '2024-01-01T13:00:00.000Z',
    title: 'Device 1',
    deviceId: 1,
  },
  {
    startDate: '2024-01-02T12:00:00.000Z',
    endDate: '2024-01-02T12:30:00.000Z',
    title: 'Device 1',
    deviceId: 1,
  },
  {
    startDate: '2024-01-03T14:00:00.000Z',
    title: 'Device 1',
    deviceId: 1,
    warning: Warning.MISSING_OFF,
  },
]

export { deviceEvents, resultViewmodels }

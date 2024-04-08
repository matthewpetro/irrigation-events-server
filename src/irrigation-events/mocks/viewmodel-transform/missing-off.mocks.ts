import { IrrigationEvent } from '../../interfaces/irrigation-event.interface'
import { DeviceState } from '@/enums/device-state.enum'
import { Warning } from '../../enums/warning.enum'
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
  {
    timestamp: new Date('2024-01-03T15:00:00Z'),
    deviceName: 'Device 1',
    deviceId: 1,
    state: DeviceState.OFF,
  },
]

const deviceEvents = { deviceId: 1, events: deviceIrrigationEvents } as DeviceEvents

const resultViewmodels: IrrigationEventViewmodel[] = [
  {
    startTimestamp: '2024-01-01T12:00:00.000Z',
    title: 'Device 1',
    deviceId: 1,
    warning: Warning.MISSING_OFF,
  },
  {
    startTimestamp: '2024-01-02T12:00:00.000Z',
    endTimestamp: '2024-01-02T12:30:00.000Z',
    title: 'Device 1',
    deviceId: 1,
  },
  {
    startTimestamp: '2024-01-03T14:00:00.000Z',
    endTimestamp: '2024-01-03T15:00:00.000Z',
    title: 'Device 1',
    deviceId: 1,
  },
]

export { deviceEvents, resultViewmodels }

import { IrrigationEvent } from '../../interfaces/irrigation-event.interface'
import { DeviceState } from '../../enums/device-state.interface'
import { DeviceEvents } from '../../interfaces/device-events.interface'
import { IrrigationEventViewmodel } from '../../dto/irrigation-event-viewmodel.dto'

const device1IrrigationEvents: IrrigationEvent[] = [
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
  {
    timestamp: new Date('2024-01-03T15:00:00Z'),
    deviceName: 'Device 1',
    deviceId: 1,
    state: DeviceState.OFF,
  },
]

const deviceEvents1 = { deviceId: 1, events: device1IrrigationEvents } as DeviceEvents

const device2IrrigationEvents: IrrigationEvent[] = [
  {
    timestamp: new Date('2024-01-01T07:00:00Z'),
    deviceName: 'Device 2',
    deviceId: 2,
    state: DeviceState.ON,
  },
  {
    timestamp: new Date('2024-01-01T07:15:00Z'),
    deviceName: 'Device 2',
    deviceId: 2,
    state: DeviceState.OFF,
  },
  {
    timestamp: new Date('2024-01-02T07:00:00Z'),
    deviceName: 'Device 2',
    deviceId: 2,
    state: DeviceState.ON,
  },
  {
    timestamp: new Date('2024-01-02T07:15:00Z'),
    deviceName: 'Device 2',
    deviceId: 2,
    state: DeviceState.OFF,
  },
  {
    timestamp: new Date('2024-01-03T07:00:00Z'),
    deviceName: 'Device 2',
    deviceId: 2,
    state: DeviceState.ON,
  },
  {
    timestamp: new Date('2024-01-03T07:15:00Z'),
    deviceName: 'Device 2',
    deviceId: 2,
    state: DeviceState.OFF,
  },
]

const deviceEvents2 = { deviceId: 2, events: device2IrrigationEvents } as DeviceEvents

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
    endDate: '2024-01-03T15:00:00.000Z',
    title: 'Device 1',
    deviceId: 1,
  },
  {
    startDate: '2024-01-01T07:00:00.000Z',
    endDate: '2024-01-01T07:15:00.000Z',
    title: 'Device 2',
    deviceId: 2,
  },
  {
    startDate: '2024-01-02T07:00:00.000Z',
    endDate: '2024-01-02T07:15:00.000Z',
    title: 'Device 2',
    deviceId: 2,
  },
  {
    startDate: '2024-01-03T07:00:00.000Z',
    endDate: '2024-01-03T07:15:00.000Z',
    title: 'Device 2',
    deviceId: 2,
  },
]

export { deviceEvents1, deviceEvents2, resultViewmodels }

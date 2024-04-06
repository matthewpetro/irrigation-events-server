import { IrrigationProgram } from '@/irrigation-programs/interfaces/irrigation-program.interface'

export const singleDeviceMock: IrrigationProgram = {
  id: '1',
  name: 'Test Program 1',
  duration: 15,
  wateringPeriod: 2,
  startTime: '07:00',
  deviceIds: [1],
  simultaneousIrrigation: false,
}

export const multipleDevicesSimultaneousMock: IrrigationProgram = {
  id: '2',
  name: 'Test Program 2',
  duration: 15,
  wateringPeriod: 2,
  startTime: '07:00',
  deviceIds: [1, 2],
  simultaneousIrrigation: true,
}

export const multipleDevicesSequentialMock: IrrigationProgram = {
  id: '3',
  name: 'Test Program 3',
  duration: 15,
  wateringPeriod: 2,
  startTime: '07:00',
  deviceIds: [1, 2],
  simultaneousIrrigation: false,
}

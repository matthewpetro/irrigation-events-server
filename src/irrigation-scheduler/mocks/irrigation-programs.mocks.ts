import { IrrigationProgram } from '@/irrigation-programs/interfaces/irrigation-program.interface'
import { SunriseSunset } from '@/sunrise-sunset/interfaces/sunrise-sunset.interface'
import { interval, set, startOfMinute } from 'date-fns'

export const referenceDate = new Date('2024-01-01T00:00:00.000')

export const sunriseSunsetMock: SunriseSunset = {
  sunrise: startOfMinute(set(referenceDate, { hours: 6, minutes: 0 })),
  sunset: startOfMinute(set(referenceDate, { hours: 17, minutes: 0 })),
}

export const singleDeviceMock: IrrigationProgram = {
  id: '1',
  name: 'Test Program 1',
  duration: 15,
  wateringPeriod: 2,
  startTimes: ['07:00'],
  deviceIds: [1],
  simultaneousIrrigation: false,
}

export const singleDeviceRunningMock: IrrigationProgram = {
  ...singleDeviceMock,
  nextRunDate: '2024-01-03',
  deviceIntervals: [
    {
      deviceId: 1,
      interval: interval(
        startOfMinute(set(referenceDate, { hours: 7, minutes: 0 })),
        startOfMinute(set(referenceDate, { hours: 7, minutes: 15 }))
      ),
    },
  ],
}

export const singleDeviceSunriseSunsetMock: IrrigationProgram = {
  id: '2',
  name: 'Test Program 2',
  duration: 15,
  wateringPeriod: 2,
  startTimes: ['sunrise', 'sunset'],
  deviceIds: [1],
  simultaneousIrrigation: false,
}

export const singleDeviceSunriseSunsetRunningMock: IrrigationProgram = {
  ...singleDeviceSunriseSunsetMock,
  nextRunDate: '2024-01-03',
  deviceIntervals: [
    {
      deviceId: 1,
      interval: interval(
        startOfMinute(set(referenceDate, { hours: 6, minutes: 30 })),
        startOfMinute(set(referenceDate, { hours: 6, minutes: 45 }))
      ),
    },
    {
      deviceId: 1,
      interval: interval(
        startOfMinute(set(referenceDate, { hours: 18, minutes: 30 })),
        startOfMinute(set(referenceDate, { hours: 18, minutes: 45 }))
      ),
    },
  ],
}

export const multipleDevicesSimultaneousMock: IrrigationProgram = {
  id: '3',
  name: 'Test Program 3',
  duration: 15,
  wateringPeriod: 2,
  startTimes: ['07:00'],
  deviceIds: [1, 2],
  simultaneousIrrigation: true,
}

export const multipleDevicesSimultaneousRunningMock: IrrigationProgram = {
  ...multipleDevicesSimultaneousMock,
  nextRunDate: '2024-01-03',
  deviceIntervals: [
    {
      deviceId: 1,
      interval: interval(
        startOfMinute(set(referenceDate, { hours: 7, minutes: 0 })),
        startOfMinute(set(referenceDate, { hours: 7, minutes: 15 }))
      ),
    },
    {
      deviceId: 2,
      interval: interval(
        startOfMinute(set(referenceDate, { hours: 7, minutes: 0 })),
        startOfMinute(set(referenceDate, { hours: 7, minutes: 15 }))
      ),
    },
  ],
}

export const multipleDevicesSequentialMock: IrrigationProgram = {
  id: '4',
  name: 'Test Program 4',
  duration: 15,
  wateringPeriod: 2,
  startTimes: ['07:00'],
  deviceIds: [1, 2],
  simultaneousIrrigation: false,
}

export const multipleDevicesSequentialRunningMock: IrrigationProgram = {
  ...multipleDevicesSequentialMock,
  nextRunDate: '2024-01-03',
  deviceIntervals: [
    {
      deviceId: 1,
      interval: interval(
        startOfMinute(set(referenceDate, { hours: 7, minutes: 0 })),
        startOfMinute(set(referenceDate, { hours: 7, minutes: 15 }))
      ),
    },
    {
      deviceId: 2,
      interval: interval(
        startOfMinute(set(referenceDate, { hours: 7, minutes: 15 })),
        startOfMinute(set(referenceDate, { hours: 7, minutes: 30 }))
      ),
    },
  ],
}

export const multipleDevicesMultipleStartTimesMock: IrrigationProgram = {
  id: '4',
  name: 'Test Program 4',
  duration: 15,
  wateringPeriod: 2,
  startTimes: ['07:00', '10:00'],
  deviceIds: [1, 2],
  simultaneousIrrigation: false,
}

export const multipleDevicesMultipleStartTimesRunningMock: IrrigationProgram = {
  ...multipleDevicesMultipleStartTimesMock,
  nextRunDate: '2024-01-03',
  deviceIntervals: [
    {
      deviceId: 1,
      interval: interval(
        startOfMinute(set(referenceDate, { hours: 7, minutes: 0 })),
        startOfMinute(set(referenceDate, { hours: 7, minutes: 15 }))
      ),
    },
    {
      deviceId: 2,
      interval: interval(
        startOfMinute(set(referenceDate, { hours: 7, minutes: 15 })),
        startOfMinute(set(referenceDate, { hours: 7, minutes: 30 }))
      ),
    },
    {
      deviceId: 1,
      interval: interval(
        startOfMinute(set(referenceDate, { hours: 10, minutes: 0 })),
        startOfMinute(set(referenceDate, { hours: 10, minutes: 15 }))
      ),
    },
    {
      deviceId: 2,
      interval: interval(
        startOfMinute(set(referenceDate, { hours: 10, minutes: 15 })),
        startOfMinute(set(referenceDate, { hours: 10, minutes: 30 }))
      ),
    },
  ],
}

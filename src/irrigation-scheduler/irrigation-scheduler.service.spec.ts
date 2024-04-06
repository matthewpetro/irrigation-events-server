import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationSchedulerService } from './irrigation-scheduler.service'
import { ConfigModule } from '@nestjs/config'
import { IrrigationProgramsService } from '@/irrigation-programs/irrigation-programs.service'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { SunriseSunsetService } from '@/sunrise-sunset/sunrise-sunset.service'
import { interval, set, startOfMinute } from 'date-fns'
import { IrrigationProgram } from '@/irrigation-programs/interfaces/irrigation-program.interface'
import { DeviceState } from '@/enums/device-state.interface'
import {
  singleDeviceMock,
  multipleDevicesSequentialMock,
  multipleDevicesSimultaneousMock,
} from './mocks/irrigation-programs.mocks'

const referenceDate = new Date('2024-01-01T12:00:00.000-07:00')
jest.useFakeTimers({ doNotFake: ['setTimeout'] })
jest.setSystemTime(referenceDate)

const mockIrrigationProgramsService = {
  findAll: jest.fn(),
  update: jest.fn().mockResolvedValue(undefined),
}

const mockMakerApiService = {
  setDeviceState: jest.fn().mockResolvedValue(undefined),
}

const mockSunriseSunsetService = {
  getSunriseSunset: jest.fn().mockResolvedValue({
    sunrise: set(referenceDate, { hours: 6, minutes: 0 }),
    sunset: set(referenceDate, { hours: 17, minutes: 0 }),
  }),
}

describe('IrrigationSchedulerService', () => {
  let service: IrrigationSchedulerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IrrigationSchedulerService],
      imports: [ConfigModule.forRoot({ envFilePath: '.env.testing' })],
    })
      .useMocker((token) => {
        if (token === IrrigationProgramsService) {
          return mockIrrigationProgramsService
        }
        if (token === MakerApiService) {
          return mockMakerApiService
        }
        if (token === SunriseSunsetService) {
          return mockSunriseSunsetService
        }
      })
      .compile()
    service = module.get<IrrigationSchedulerService>(IrrigationSchedulerService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('program with one device', () => {
    it('should not start the program before the start time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 6, minutes: 59 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([singleDeviceMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).not.toHaveBeenCalled()
    })
    it('should start the program at the start time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 0 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([singleDeviceMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith('1', {
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
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.ON)
    })
    it('should do nothing in the middle of the run time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 7 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([
        {
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
        },
      ])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).not.toHaveBeenCalled()
    })
    it('should stop the program at the end time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 15 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([
        {
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
        },
      ])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith('1', {
        deviceIntervals: null,
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.OFF)
    })
  })

  describe('program with multiple devices and simultaneous irrigation set to true', () => {
    it('should start the program at the start time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 0 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesSimultaneousMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith('2', {
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
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.ON)
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(2, DeviceState.ON)
    })
    it('should do nothing in the middle of the run time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 7 }))
      const mockRunningProgram: IrrigationProgram = {
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
      mockIrrigationProgramsService.findAll.mockResolvedValue([mockRunningProgram])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).not.toHaveBeenCalled()
    })
    it('should stop the program at the end time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 15 }))
      const mockRunningProgram: IrrigationProgram = {
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
      mockIrrigationProgramsService.findAll.mockResolvedValue([mockRunningProgram])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith('2', {
        deviceIntervals: null,
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.OFF)
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(2, DeviceState.OFF)
    })
  })

  describe('program with multiple devices and simultaneous irrigation set to false', () => {
    it('should start the program at the start time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 0 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesSequentialMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith('3', {
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
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.ON)
    })
    it('should do nothing in the middle of the run time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 7 }))
      const mockRunningProgram: IrrigationProgram = {
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
      mockIrrigationProgramsService.findAll.mockResolvedValue([mockRunningProgram])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).not.toHaveBeenCalled()
    })
    it('should switch devices at the correct time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 15 }))
      const mockRunningProgram: IrrigationProgram = {
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
      mockIrrigationProgramsService.findAll.mockResolvedValue([mockRunningProgram])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.OFF)
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(2, DeviceState.ON)
    })
    it('should stop the program at the end time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 30 }))
      const mockRunningProgram: IrrigationProgram = {
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
      mockIrrigationProgramsService.findAll.mockResolvedValue([mockRunningProgram])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith('3', {
        deviceIntervals: null,
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(2, DeviceState.OFF)
    })
  })
})

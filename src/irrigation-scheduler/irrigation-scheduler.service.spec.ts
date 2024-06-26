import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { set } from 'date-fns'
import { IrrigationSchedulerService } from './irrigation-scheduler.service'
import { IrrigationProgramsService } from '@/irrigation-programs/irrigation-programs.service'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { SunriseSunsetService } from '@/sunrise-sunset/sunrise-sunset.service'
import { DeviceState } from '@/enums/device-state.enum'
import {
  referenceDate,
  sunriseSunsetMock,
  singleDeviceRunningMock,
  singleDeviceMock,
  singleDeviceSunriseSunsetMock,
  singleDeviceSunriseSunsetRunningMock,
  multipleDevicesSimultaneousMock,
  multipleDevicesSimultaneousRunningMock,
  multipleDevicesSequentialMock,
  multipleDevicesSequentialRunningMock,
  multipleDevicesMultipleStartTimesMock,
  multipleDevicesMultipleStartTimesRunningMock,
} from './mocks/irrigation-programs.mocks'

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
  getSunriseSunset: jest.fn().mockResolvedValue(sunriseSunsetMock),
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
        return null
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
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith(singleDeviceMock.id, {
        nextRunDate: singleDeviceRunningMock.nextRunDate,
        deviceIntervals: singleDeviceRunningMock.deviceIntervals,
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.ON)
    })
    it('should do nothing in the middle of the run time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 7 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([singleDeviceRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).not.toHaveBeenCalled()
    })
    it('should stop the program at the end time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 15 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([singleDeviceRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith(singleDeviceRunningMock.id, {
        deviceIntervals: null,
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.OFF)
    })
  })

  describe('program with one device and sunrise/sunset start times', () => {
    it('should calculate intervals using the default sunrise and sunset times', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 6, minutes: 30 }))
      mockSunriseSunsetService.getSunriseSunset.mockResolvedValue(undefined)
      mockIrrigationProgramsService.findAll.mockResolvedValue([singleDeviceSunriseSunsetMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith(singleDeviceSunriseSunsetMock.id, {
        nextRunDate: singleDeviceSunriseSunsetRunningMock.nextRunDate,
        deviceIntervals: singleDeviceSunriseSunsetRunningMock.deviceIntervals,
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.ON)
    })
  })

  describe('program with multiple devices and simultaneous irrigation set to true', () => {
    it('should start the program at the start time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 0 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesSimultaneousMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith(multipleDevicesSimultaneousMock.id, {
        nextRunDate: multipleDevicesSimultaneousRunningMock.nextRunDate,
        deviceIntervals: multipleDevicesSimultaneousRunningMock.deviceIntervals,
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.ON)
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(2, DeviceState.ON)
    })
    it('should do nothing in the middle of the run time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 7 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesSimultaneousRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).not.toHaveBeenCalled()
    })
    it('should stop the program at the end time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 15 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesSimultaneousRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith(multipleDevicesSimultaneousRunningMock.id, {
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
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith(multipleDevicesSequentialMock.id, {
        nextRunDate: multipleDevicesSequentialRunningMock.nextRunDate,
        deviceIntervals: multipleDevicesSequentialRunningMock.deviceIntervals,
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.ON)
    })
    it('should do nothing in the middle of the run time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 7 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesSequentialRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).not.toHaveBeenCalled()
    })
    it('should switch devices at the correct time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 15 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesSequentialRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.OFF)
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(2, DeviceState.ON)
    })
    it('should stop the program at the end time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 30 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesSequentialRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith(multipleDevicesSequentialRunningMock.id, {
        deviceIntervals: null,
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(2, DeviceState.OFF)
    })
  })

  describe('program with multiple devices and multiple start times', () => {
    it('should start the program at the start time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 0 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesMultipleStartTimesMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith(multipleDevicesMultipleStartTimesMock.id, {
        nextRunDate: multipleDevicesMultipleStartTimesRunningMock.nextRunDate,
        deviceIntervals: multipleDevicesMultipleStartTimesRunningMock.deviceIntervals,
      })
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.ON)
    })
    it('should do nothing in the middle of the run time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 7 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesMultipleStartTimesRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).not.toHaveBeenCalled()
    })
    it('should switch devices at the correct time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 15 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesMultipleStartTimesRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.OFF)
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(2, DeviceState.ON)
    })
    it('should turn off devices and not stop the program at the end of the first run time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 7, minutes: 30 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesMultipleStartTimesRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(2, DeviceState.OFF)
    })
    it('should turn on devices at the beginning of the second run time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 10, minutes: 0 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesMultipleStartTimesRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).not.toHaveBeenCalled()
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(1, DeviceState.ON)
    })
    it('should stop the program at the end time', async () => {
      jest.setSystemTime(set(referenceDate, { hours: 10, minutes: 30 }))
      mockIrrigationProgramsService.findAll.mockResolvedValue([multipleDevicesMultipleStartTimesRunningMock])
      await service.run()
      expect(mockSunriseSunsetService.getSunriseSunset).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
      expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith(
        multipleDevicesMultipleStartTimesRunningMock.id,
        {
          deviceIntervals: null,
        }
      )
      expect(mockMakerApiService.setDeviceState).toHaveBeenCalledWith(2, DeviceState.OFF)
    })
  })
})

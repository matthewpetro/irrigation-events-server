import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationSchedulerService } from './irrigation-scheduler.service'
import { IrrigationProgramsModule } from '@/irrigation-programs/irrigation-programs.module'
import { MakerApiModule } from '@/maker-api/maker-api.module'
import { SunriseSunsetModule } from '@/sunrise-sunset/sunrise-sunset.module'
import { ConfigModule } from '@nestjs/config'
import { IrrigationProgramsService } from '@/irrigation-programs/irrigation-programs.service'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { SunriseSunsetService } from '@/sunrise-sunset/sunrise-sunset.service'
import { addDays, format, parseISO, subDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

const mockIrrigationProgramsService = {
  findAll: jest.fn(),
  update: jest.fn(),
}

const mockMakerApiService = {
  setDeviceState: jest.fn(),
}

const mockSunriseSunsetService = {
  getSunriseSunset: jest.fn(),
}

describe('IrrigationSchedulerService', () => {
  let service: IrrigationSchedulerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IrrigationSchedulerService],
      imports: [
        ConfigModule.forRoot({ envFilePath: '.env.testing' }),
        IrrigationProgramsModule,
        MakerApiModule,
        SunriseSunsetModule,
      ],
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

  it('should do nothing if no programs are running or need to start', () => {
    mockSunriseSunsetService.getSunriseSunset.mockResolvedValue({
      sunrise: parseISO('2024-02-12T07:15:32-07:00'),
      sunset: parseISO('2024-02-12T18:12:30-07:00'),
    })
    mockIrrigationProgramsService.findAll.mockResolvedValue([
      // Next run date is in the future
      {
        id: uuidv4(),
        name: 'Test 1',
        duration: 5,
        wateringPeriod: 2,
        startTime: '06:00',
        deviceIds: [1],
        simultaneousIrrigation: false,
        nextRunDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      },
      // No next run date
      {
        id: uuidv4(),
        name: 'Test 2',
        duration: 10,
        wateringPeriod: 3,
        startTime: '07:00',
        deviceIds: [2],
        simultaneousIrrigation: false,
      },
      // Next run date is today
      {
        id: uuidv4(),
        name: 'Test 3',
        duration: 10,
        wateringPeriod: 3,
        startTime: '07:00',
        deviceIds: [3],
        simultaneousIrrigation: false,
        nextRunDate: format(new Date(), 'yyyy-MM-dd'),
      },
      // Next run date is in the past
      {
        id: uuidv4(),
        name: 'Test 4',
        duration: 10,
        wateringPeriod: 3,
        startTime: '07:00',
        deviceIds: [4],
        simultaneousIrrigation: false,
        nextRunDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      },
    ])
  })

  it('should correctly calculate the next run date', () => {})

  describe('start time conversions', () => {
    it('should correctly convert a start time  to actual time', () => {})
    it('should correctly convert sunrise start time to actual time', () => {})
    it('should correctly convert sunset start time to actual time', () => {})
  })

  describe('program with one device', () => {
    it('should start the program', () => {})
    it('should stop the program', () => {})
  })

  describe('program with multiple devices and simultaneous irrigation set to true', () => {
    it('should start the program', () => {})
    it('should stop the program', () => {})
  })

  describe('program with multiple devices and simultaneous irrigation set to false', () => {
    it('should start the program', () => {})
    it('should turn off one device and turn another on', () => {})
    it('should stop the program', () => {})
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationSchedulerService } from './irrigation-scheduler.service'
import { IrrigationProgramsModule } from '@/irrigation-programs/irrigation-programs.module'
import { MakerApiModule } from '@/maker-api/maker-api.module'
import { SunriseSunsetModule } from '@/sunrise-sunset/sunrise-sunset.module'
import { ConfigModule } from '@nestjs/config'
import { IrrigationProgramsService } from '@/irrigation-programs/irrigation-programs.service'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { SunriseSunsetService } from '@/sunrise-sunset/sunrise-sunset.service'

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

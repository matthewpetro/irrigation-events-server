import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationSchedulerService } from './irrigation-scheduler.service'
import { IrrigationProgramsModule } from '@/irrigation-programs/irrigation-programs.module'
import { MakerApiModule } from '@/maker-api/maker-api.module'
import { SunriseSunsetModule } from '@/sunrise-sunset/sunrise-sunset.module'

describe('IrrigationSchedulerService', () => {
  let service: IrrigationSchedulerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IrrigationSchedulerService],
      imports: [IrrigationProgramsModule, MakerApiModule, SunriseSunsetModule],
    }).compile()

    service = module.get<IrrigationSchedulerService>(IrrigationSchedulerService)
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

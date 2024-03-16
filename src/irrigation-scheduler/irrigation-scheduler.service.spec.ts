import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationSchedulerService } from './irrigation-scheduler.service'

xdescribe('IrrigationSchedulerService', () => {
  let service: IrrigationSchedulerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IrrigationSchedulerService],
    }).compile()

    service = module.get<IrrigationSchedulerService>(IrrigationSchedulerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

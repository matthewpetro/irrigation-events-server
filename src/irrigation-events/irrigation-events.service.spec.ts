import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationEventsService } from './irrigation-events.service'

describe('IrrigationEventsService', () => {
  let service: IrrigationEventsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IrrigationEventsService],
    }).compile()

    service = module.get<IrrigationEventsService>(IrrigationEventsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationEventsService } from '@/irrigation-events/irrigation-events.service'
import { ConfigModule } from '@nestjs/config'

describe('IrrigationEventsService', () => {
  let service: IrrigationEventsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ envFilePath: '.env.local' })],
      providers: [IrrigationEventsService],
    }).compile()

    service = module.get<IrrigationEventsService>(IrrigationEventsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

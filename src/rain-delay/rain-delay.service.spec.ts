import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { RainDelayService } from '@/rain-delay/rain-delay.service'
import { DatabaseModule } from '@/database/database.module'

describe('RainDelayService', () => {
  let service: RainDelayService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RainDelayService],
      imports: [ConfigModule.forRoot({ envFilePath: '.env.testing' }), DatabaseModule],
    }).compile()

    service = module.get<RainDelayService>(RainDelayService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { MakerApiService } from '@/irrigation-events/maker-api.service'
import { ConfigModule } from '@nestjs/config'

describe('MakerApiService', () => {
  let service: MakerApiService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ envFilePath: '.env.local' })],
      providers: [MakerApiService],
    }).compile()

    service = module.get<MakerApiService>(MakerApiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

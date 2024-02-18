import { Test, TestingModule } from '@nestjs/testing'
import { WateringProgramsService } from './watering-programs.service'

describe('WateringProgramsService', () => {
  let service: WateringProgramsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WateringProgramsService],
    }).compile()

    service = module.get<WateringProgramsService>(WateringProgramsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationProgramsService } from './watering-programs.service'

describe('IrrigationProgramsService', () => {
  let service: IrrigationProgramsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IrrigationProgramsService],
    }).compile()

    service = module.get<IrrigationProgramsService>(IrrigationProgramsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { WateringProgramsController } from './watering-programs.controller'
import { WateringProgramsService } from './watering-programs.service'

describe('WateringProgramsController', () => {
  let controller: WateringProgramsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WateringProgramsController],
      providers: [WateringProgramsService],
    }).compile()

    controller = module.get<WateringProgramsController>(WateringProgramsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { RainDelayController } from './rain-delay.controller'
import { RainDelayService } from './rain-delay.service'

const mockRainDelayService = {
  get: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}

describe('RainDelayController', () => {
  let controller: RainDelayController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RainDelayController],
    })
      .useMocker((token) => {
        if (token === RainDelayService) {
          return mockRainDelayService
        }
        return null
      })
      .compile()

    controller = module.get<RainDelayController>(RainDelayController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})

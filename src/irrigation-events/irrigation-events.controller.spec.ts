import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationEventsController } from '@/irrigation-events/irrigation-events.controller'
import { MakerApiService } from './maker-api.service'
import { ViewmodelTransformService } from './viewmodel-transform.service'
import { IrrigationEventsService } from './irrigation-events.service'
import { ConfigModule } from '@nestjs/config'

describe('IrrigationEventsController', () => {
  let controller: IrrigationEventsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ envFilePath: '.env.local' })],
      controllers: [IrrigationEventsController],
      providers: [IrrigationEventsService, MakerApiService, ViewmodelTransformService],
    }).compile()

    controller = module.get<IrrigationEventsController>(IrrigationEventsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { ViewmodelTransformService } from '@/irrigation-events/viewmodel-transform.service'

describe('ViewmodelTransformService', () => {
  let service: ViewmodelTransformService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ViewmodelTransformService],
    }).compile()

    service = module.get<ViewmodelTransformService>(ViewmodelTransformService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

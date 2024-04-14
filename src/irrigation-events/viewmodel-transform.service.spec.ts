import { Test, TestingModule } from '@nestjs/testing'
import { ViewmodelTransformService } from '@/irrigation-events/viewmodel-transform.service'
import * as happyPathMocks from './mocks/viewmodel-transform/happy-path.mocks'
import * as missingOffMocks from './mocks/viewmodel-transform/missing-off.mocks'
import * as missingFinalOffMocks from './mocks/viewmodel-transform/missing-final-off.mocks'
import * as missingFinalOffUnknownStateMocks from './mocks/viewmodel-transform/missing-final-off-unknown-state.mocks'
import * as deviceCurrentlyOnMocks from './mocks/viewmodel-transform/device-currently-on.mocks'
import * as missingOnMocks from './mocks/viewmodel-transform/missing-on.mocks'

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

  it('happy path transformation', () => {
    const viewmodels = service.transform([happyPathMocks.deviceEvents1, happyPathMocks.deviceEvents2])
    expect(viewmodels).toEqual(expect.arrayContaining(happyPathMocks.resultViewmodels))
  })

  it('off event missing', () => {
    const viewmodels = service.transform([missingOffMocks.deviceEvents])
    expect(viewmodels).toEqual(expect.arrayContaining(missingOffMocks.resultViewmodels))
  })

  it('final off missing', () => {
    const viewmodels = service.transform([missingFinalOffMocks.deviceEvents])
    expect(viewmodels).toEqual(expect.arrayContaining(missingFinalOffMocks.resultViewmodels))
  })

  it('final off missing and unknown device state', () => {
    const viewmodels = service.transform([missingFinalOffUnknownStateMocks.deviceEvents])
    expect(viewmodels).toEqual(expect.arrayContaining(missingFinalOffUnknownStateMocks.resultViewmodels))
  })

  it('device currently on', () => {
    const viewmodels = service.transform([deviceCurrentlyOnMocks.deviceEvents])
    expect(viewmodels).toEqual(expect.arrayContaining(deviceCurrentlyOnMocks.resultViewmodels))
  })

  it('on event missing', () => {
    const viewmodels = service.transform([missingOnMocks.deviceEvents])
    expect(viewmodels).toEqual(expect.arrayContaining(missingOnMocks.resultViewmodels))
  })
})

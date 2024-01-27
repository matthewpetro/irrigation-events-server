import { Test, TestingModule } from '@nestjs/testing';
import { IrrigationEventsController } from './irrigation-events.controller';

describe('IrrigationEventsController', () => {
  let controller: IrrigationEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IrrigationEventsController],
    }).compile();

    controller = module.get<IrrigationEventsController>(
      IrrigationEventsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

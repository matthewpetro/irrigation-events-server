import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationProgramsService } from './watering-programs.service'
import { DatabaseModule } from '@/database/database.module'
import { ConfigModule } from '@nestjs/config'

describe('IrrigationProgramsService', () => {
  let service: IrrigationProgramsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IrrigationProgramsService],
      imports: [ConfigModule.forRoot({ envFilePath: '.env.testing' }), DatabaseModule],
    }).compile()

    service = module.get<IrrigationProgramsService>(IrrigationProgramsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

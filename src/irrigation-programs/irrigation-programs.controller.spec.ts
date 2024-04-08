import { Test, TestingModule } from '@nestjs/testing'
import { v4 as uuidv4 } from 'uuid'
import { IrrigationProgramsController } from './irrigation-programs.controller'
import { IrrigationProgramsService } from './irrigation-programs.service'
import { CreateIrrigationProgramDto } from './dto/create-irrigation-program.dto'
import { IrrigationProgramDto } from './dto/irrigation-program.dto'

const mockIrrigationProgramsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}

const mockCreateDto = {
  duration: 10,
  wateringPeriod: 2,
  startTimes: ['12:00'],
  deviceIds: [1, 2],
  simultaneousIrrigation: true,
} as CreateIrrigationProgramDto

const mockDto = {
  id: uuidv4(),
  ...mockCreateDto,
} as IrrigationProgramDto

describe('IrrigationProgramsController', () => {
  let controller: IrrigationProgramsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IrrigationProgramsController],
    })
      .useMocker((token) => {
        if (token === IrrigationProgramsService) {
          return mockIrrigationProgramsService
        }
      })
      .compile()

    controller = module.get<IrrigationProgramsController>(IrrigationProgramsController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should call create', async () => {
    mockIrrigationProgramsService.create.mockResolvedValue({ id: uuidv4(), ...mockCreateDto })
    const result = await controller.create(mockCreateDto)
    expect(mockIrrigationProgramsService.create).toHaveBeenCalledWith(mockCreateDto)
    expect(result).toEqual({
      id: expect.stringMatching(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i),
      ...mockCreateDto,
    })
  })

  it('should call findAll', async () => {
    mockIrrigationProgramsService.findAll.mockResolvedValue([mockDto])
    const result = await controller.findAll()
    expect(mockIrrigationProgramsService.findAll).toHaveBeenCalled()
    expect(result).toEqual([mockDto])
  })

  it('should call findOne', async () => {
    mockIrrigationProgramsService.findOne.mockResolvedValue(mockDto)
    const result = await controller.findOne(mockDto.id)
    expect(mockIrrigationProgramsService.findOne).toHaveBeenCalledWith(mockDto.id)
    expect(result).toEqual(mockDto)
  })

  it('should call update', async () => {
    const dto = { duration: 20 }
    mockIrrigationProgramsService.update.mockResolvedValue({ ...mockDto, ...dto })
    const result = await controller.update(mockDto.id, dto)
    expect(mockIrrigationProgramsService.update).toHaveBeenCalledWith(mockDto.id, dto)
    expect(result).toEqual({ ...mockDto, ...dto })
  })

  it('should call remove', async () => {
    mockIrrigationProgramsService.remove.mockResolvedValue(mockDto)
    await controller.remove(mockDto.id)
    expect(mockIrrigationProgramsService.remove).toHaveBeenCalledWith(mockDto.id)
  })
})

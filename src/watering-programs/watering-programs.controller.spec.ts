import { Test, TestingModule } from '@nestjs/testing'
import { v4 as uuidv4 } from 'uuid'
import { WateringProgramsController } from './watering-programs.controller'
import { WateringProgramsService } from './watering-programs.service'
import { CreateWateringProgramDto } from './dto/create-watering-program.dto'
import { WateringProgramDto } from './dto/watering-program.dto'

const mockWateringProgramsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}

const mockCreateDto = {
  duration: 10,
  wateringPeriod: 2,
  startTime: '12:00:00',
  switches: [1, 2],
  simultaneousWatering: true,
} as CreateWateringProgramDto

const mockDto = {
  id: uuidv4(),
  ...mockCreateDto,
} as WateringProgramDto

describe('WateringProgramsController', () => {
  let controller: WateringProgramsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WateringProgramsController],
    })
      .useMocker((token) => {
        if (token === WateringProgramsService) {
          return mockWateringProgramsService
        }
      })
      .compile()

    controller = module.get<WateringProgramsController>(WateringProgramsController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should call create', async () => {
    mockWateringProgramsService.create.mockResolvedValue({ id: uuidv4(), ...mockCreateDto })
    const result = await controller.create(mockCreateDto)
    expect(mockWateringProgramsService.create).toHaveBeenCalledWith(mockCreateDto)
    expect(result).toEqual({
      id: expect.stringMatching(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i),
      ...mockCreateDto,
    })
  })

  it('should call findAll', async () => {
    mockWateringProgramsService.findAll.mockResolvedValue([mockDto])
    const result = await controller.findAll()
    expect(mockWateringProgramsService.findAll).toHaveBeenCalled()
    expect(result).toEqual([mockDto])
  })

  it('should call findOne', async () => {
    mockWateringProgramsService.findOne.mockResolvedValue(mockDto)
    const result = await controller.findOne(mockDto.id)
    expect(mockWateringProgramsService.findOne).toHaveBeenCalledWith(mockDto.id)
    expect(result).toEqual(mockDto)
  })

  it('should call update', async () => {
    const dto = { duration: 20 }
    mockWateringProgramsService.update.mockResolvedValue({ ...mockDto, ...dto })
    const result = await controller.update(mockDto.id, dto)
    expect(mockWateringProgramsService.update).toHaveBeenCalledWith(mockDto.id, dto)
    expect(result).toEqual({ ...mockDto, ...dto })
  })

  it('should call remove', async () => {
    mockWateringProgramsService.remove.mockResolvedValue(mockDto)
    const result = await controller.remove(mockDto.id)
    expect(mockWateringProgramsService.remove).toHaveBeenCalledWith(mockDto.id)
    expect(result).toEqual(mockDto)
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { v4 as uuidv4 } from 'uuid'
import { WateringProgramsController } from './watering-programs.controller'
import { WateringProgramsService } from './watering-programs.service'
import { CreateWateringProgramDto } from './dto/create-watering-program.dto'

const mockWateringProgramsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}

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
    const dto = {
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousWatering: true,
    } as CreateWateringProgramDto
    mockWateringProgramsService.create.mockResolvedValue({ id: uuidv4(), ...dto })
    const result = await controller.create(dto)
    expect(mockWateringProgramsService.create).toHaveBeenCalledWith(dto)
    expect(result).toEqual({
      id: expect.stringMatching(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i),
      ...dto,
    })
  })

  it('should call findAll', async () => {
    const mockData = [
      {
        id: uuidv4(),
        duration: 10,
        wateringPeriod: 2,
        startTime: '12:00:00Z',
        switches: [1, 2],
        simultaneousWatering: true,
      },
    ]
    mockWateringProgramsService.findAll.mockResolvedValue(mockData)
    const result = await controller.findAll()
    expect(mockWateringProgramsService.findAll).toHaveBeenCalled()
    expect(result).toEqual(mockData)
  })

  it('should call findOne', async () => {
    const mockData = {
      id: uuidv4(),
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousWatering: true,
    }
    mockWateringProgramsService.findOne.mockResolvedValue(mockData)
    const result = await controller.findOne(mockData.id)
    expect(mockWateringProgramsService.findOne).toHaveBeenCalledWith(mockData.id)
    expect(result).toEqual(mockData)
  })

  it('should call update', async () => {
    const id = uuidv4()
    const dto = {
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousWatering: true,
    }
    mockWateringProgramsService.update.mockResolvedValue({ id, ...dto })
    const result = await controller.update(id, dto)
    expect(mockWateringProgramsService.update).toHaveBeenCalledWith(id, dto)
    expect(result).toEqual({ id, ...dto })
  })

  it('should call remove', async () => {
    const mockData = {
      id: uuidv4(),
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousWatering: true,
    }
    mockWateringProgramsService.remove.mockResolvedValue(mockData)
    const result = await controller.remove(mockData.id)
    expect(mockWateringProgramsService.remove).toHaveBeenCalledWith(mockData.id)
    expect(result).toEqual(mockData)
  })
})

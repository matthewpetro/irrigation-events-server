import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationProgramsService } from './irrigation-programs.service'
import { DatabaseModule } from '@/database/database.module'
import { ConfigModule } from '@nestjs/config'
import { v4 as uuidv4 } from 'uuid'
import { IrrigationProgramEntity } from './entities/irrigation-program.entity'
import { IrrigationProgramDto } from './dto/irrigation-program.dto'
import { CreateIrrigationProgramDto } from './dto/create-irrigation-program.dto'
import { UpdateIrrigationProgramDto } from './dto/update-irrigation-program.dto'

// Mock the Nano library
const mockDestroy = jest.fn()
const mockFind = jest.fn()
const mockGet = jest.fn()
const mockHead = jest.fn()
const mockInsert = jest.fn()
const mockList = jest.fn()
jest.mock('nano', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        auth: jest.fn(),
        db: {
          use: jest.fn().mockReturnValue({
            destroy: mockDestroy,
            find: mockFind,
            get: mockGet,
            head: mockHead,
            insert: mockInsert,
            list: mockList,
          }),
        },
      }
    }),
  }
})

describe('IrrigationProgramsService', () => {
  let service: IrrigationProgramsService
  let testingModule: TestingModule

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      providers: [IrrigationProgramsService],
      imports: [ConfigModule.forRoot({ envFilePath: '.env.testing' }), DatabaseModule],
    }).compile()

    await testingModule.init()
    testingModule.enableShutdownHooks()
    service = testingModule.get<IrrigationProgramsService>(IrrigationProgramsService)
  })

  afterEach(async () => {
    await testingModule.close()
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create an irrigation program', async () => {
    mockInsert.mockResolvedValue({ id: uuidv4(), ok: true })
    const mockCreateDto: CreateIrrigationProgramDto = {
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousIrrigation: true,
    }
    const irrigationProgram = await service.create(mockCreateDto)
    expect(mockInsert).toHaveBeenCalledWith(mockCreateDto)
    expect(irrigationProgram).toEqual({
      id: expect.stringMatching(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i),
      ...mockCreateDto,
    })
  })

  it('should not create an irrigation program', async () => {
    mockInsert.mockResolvedValue({ ok: false })
    const mockCreateDto: CreateIrrigationProgramDto = {
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousIrrigation: true,
    }
    const irrigationProgram = await service.create(mockCreateDto)
    expect(mockInsert).toHaveBeenCalledWith(mockCreateDto)
    expect(irrigationProgram).toBeNull()
  })

  it('should find all irrigation programs', async () => {
    const mockIrrigationProgram1 = {
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousIrrigation: true,
    }
    const mockIrrigationProgram2 = {
      duration: 20,
      wateringPeriod: 4,
      startTime: '05:00:00Z',
      switches: [3],
      simultaneousIrrigation: false,
    }
    const uuid1 = uuidv4()
    const uuid2 = uuidv4()
    const mockListRepsonse = {
      rows: [{ doc: { _id: uuid1, ...mockIrrigationProgram1 } }, { doc: { _id: uuid2, ...mockIrrigationProgram2 } }],
    }
    mockList.mockResolvedValue(mockListRepsonse)
    const irrigationPrograms = await service.findAll()
    expect(mockList).toHaveBeenCalled()
    expect(irrigationPrograms).toEqual([
      { id: uuid1, ...mockIrrigationProgram1 },
      { id: uuid2, ...mockIrrigationProgram2 },
    ] as IrrigationProgramDto[])
  })

  it('should not find any irrigation programs', async () => {
    mockList.mockResolvedValue({ rows: [] })
    const irrigationPrograms = await service.findAll()
    expect(mockList).toHaveBeenCalled()
    expect(irrigationPrograms).toEqual([])
  })

  it('should find one irrigation program', async () => {
    const id = uuidv4()
    const mockPartialIrrigationProgram = {
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousIrrigation: true,
    }
    mockGet.mockResolvedValue({ _id: id, ...mockPartialIrrigationProgram } as IrrigationProgramEntity)
    const irrigationProgram = await service.findOne(id)
    expect(mockGet).toHaveBeenCalledWith(id)
    expect(irrigationProgram).toEqual({
      id: id,
      ...mockPartialIrrigationProgram,
    } as IrrigationProgramDto)
  })

  it('should not find an irrigation program', async () => {
    const id = uuidv4()
    mockGet.mockResolvedValue({ _deleted: true })
    const irrigationProgram = await service.findOne(id)
    expect(mockGet).toHaveBeenCalledWith(id)
    expect(irrigationProgram).toBeNull()
  })

  it('should update an irrigation program', async () => {
    const id = uuidv4()
    const rev = '1-234'
    const mockIrrigationProgram: IrrigationProgramEntity = {
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousIrrigation: true,
    }
    mockGet.mockResolvedValue({ _id: id, _rev: rev, ...mockIrrigationProgram })
    mockInsert.mockResolvedValue({ ok: true })
    const mockUpdateDto: UpdateIrrigationProgramDto = {
      duration: 5,
      wateringPeriod: 1,
    }
    const irrigationProgram = await service.update(id, mockUpdateDto)
    expect(mockGet).toHaveBeenCalledWith(id)
    expect(mockInsert).toHaveBeenCalledWith({ _id: id, _rev: rev, ...mockIrrigationProgram, ...mockUpdateDto })
    expect(irrigationProgram).toEqual({
      id,
      ...mockIrrigationProgram,
      ...mockUpdateDto,
    } as IrrigationProgramDto)
  })

  it('should not update an irrigation program because the program has been deleted', async () => {
    const id = uuidv4()
    mockGet.mockResolvedValue({ _deleted: true })
    const mockUpdateDto: UpdateIrrigationProgramDto = {
      duration: 5,
      wateringPeriod: 1,
    }
    const irrigationProgram = await service.update(id, mockUpdateDto)
    expect(mockGet).toHaveBeenCalledWith(id)
    expect(mockInsert).not.toHaveBeenCalled()
    expect(irrigationProgram).toBeNull()
  })

  it('should not update an irrigation program because the update failed', async () => {
    const id = uuidv4()
    const rev = '1-234'
    const mockIrrigationProgram: IrrigationProgramEntity = {
      duration: 10,
      wateringPeriod: 2,
      startTime: '12:00:00Z',
      switches: [1, 2],
      simultaneousIrrigation: true,
    }
    mockGet.mockResolvedValue({ _id: id, _rev: rev, ...mockIrrigationProgram })
    mockInsert.mockResolvedValue({ ok: false })
    const mockUpdateDto: UpdateIrrigationProgramDto = {
      duration: 5,
      wateringPeriod: 1,
    }
    const irrigationProgram = await service.update(id, mockUpdateDto)
    expect(mockGet).toHaveBeenCalledWith(id)
    expect(mockInsert).toHaveBeenCalledWith({ _id: id, _rev: rev, ...mockIrrigationProgram, ...mockUpdateDto })
    expect(irrigationProgram).toBeNull()
  })

  it('should remove an irrigation program', async () => {
    const id = uuidv4()
    const rev = '1-234'
    mockHead.mockResolvedValue({ etag: rev })
    mockDestroy.mockResolvedValue({ ok: true, id, rev })
    const result = await service.remove(id)
    expect(mockHead).toHaveBeenCalledWith(id)
    expect(mockDestroy).toHaveBeenCalledWith(id, rev)
    expect(result).toBeTruthy()
  })

  it('should not remove an irrigation program because deltion failed', async () => {
    const id = uuidv4()
    const rev = '1-234'
    mockHead.mockResolvedValue({ etag: rev })
    mockDestroy.mockResolvedValue({ ok: false })
    const result = await service.remove(id)
    expect(mockHead).toHaveBeenCalledWith(id)
    expect(mockDestroy).toHaveBeenCalledWith(id, rev)
    expect(result).toBeFalsy()
  })
})

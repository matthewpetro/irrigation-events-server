import { Test, TestingModule } from '@nestjs/testing'
import { IrrigationProgramsService } from './irrigation-programs.service'
import { DatabaseModule } from '@/database/database.module'
import { ConfigModule } from '@nestjs/config'
import { v4 as uuidv4 } from 'uuid'
import { IrrigationProgram } from './interfaces/irrigation-program.interface'
import { IrrigationProgramEntity } from './entities/irrigation-program.entity'
import { CreateIrrigationProgramDto } from './dto/create-irrigation-program.dto'
import { UpdateIrrigationProgramDto } from './dto/update-irrigation-program.dto'
import { HttpStatus } from '@nestjs/common'

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

const uuidv4Regex = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i

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

  describe('irrigation program creation', () => {
    it('should create an irrigation program', async () => {
      mockInsert.mockResolvedValue({ id: uuidv4(), ok: true })
      const mockCreateDto: CreateIrrigationProgramDto = {
        name: 'Irrigation Program 1',
        duration: 10,
        wateringPeriod: 2,
        startTimes: ['12:00'],
        deviceIds: [1, 2],
        simultaneousIrrigation: true,
      }
      const irrigationProgram = await service.create(mockCreateDto)
      expect(mockInsert).toHaveBeenCalledWith(mockCreateDto, expect.stringMatching(uuidv4Regex))
      expect(irrigationProgram).toEqual({
        id: expect.stringMatching(uuidv4Regex),
        ...mockCreateDto,
      } as IrrigationProgram)
    })

    it('should not create an irrigation program because the result is not ok', async () => {
      mockInsert.mockResolvedValue({ ok: false })
      const mockCreateDto: CreateIrrigationProgramDto = {
        name: 'Irrigation Program 1',
        duration: 10,
        wateringPeriod: 2,
        startTimes: ['12:00'],
        deviceIds: [1, 2],
        simultaneousIrrigation: true,
      }
      try {
        await service.create(mockCreateDto)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      }
      expect(mockInsert).toHaveBeenCalledWith(mockCreateDto, expect.stringMatching(uuidv4Regex))
    })

    it('should not create an irrigation program because the database throws an error', async () => {
      mockInsert.mockRejectedValue({})
      const mockCreateDto: CreateIrrigationProgramDto = {
        name: 'Irrigation Program 1',
        duration: 10,
        wateringPeriod: 2,
        startTimes: ['12:00'],
        deviceIds: [1, 2],
        simultaneousIrrigation: true,
      }
      try {
        await service.create(mockCreateDto)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      }
      expect(mockInsert).toHaveBeenCalledWith(mockCreateDto, expect.stringMatching(uuidv4Regex))
    })
  })

  describe('get all irrigation programs', () => {
    it('should find all irrigation programs', async () => {
      const mockIrrigationProgram1 = {
        name: 'Irrigation Program 1',
        duration: 10,
        wateringPeriod: 2,
        startTimes: ['12:00'],
        deviceIds: [1, 2],
        simultaneousIrrigation: true,
      }
      const mockIrrigationProgram2 = {
        name: 'Irrigation Program 2',
        duration: 20,
        wateringPeriod: 4,
        startTimes: ['05:00'],
        deviceIds: [3],
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
      ] as IrrigationProgram[])
    })

    it('should not find any irrigation programs', async () => {
      mockList.mockResolvedValue({ rows: [] })
      const irrigationPrograms = await service.findAll()
      expect(mockList).toHaveBeenCalled()
      expect(irrigationPrograms).toEqual([])
    })

    it('should not find any irrigation programs because of an unknown error', async () => {
      mockList.mockRejectedValue({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR })
      try {
        await service.findAll()
      } catch (error) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      }
      expect(mockList).toHaveBeenCalled()
    })
  })

  describe('get one irrigation program', () => {
    it('should find one irrigation program', async () => {
      const id = uuidv4()
      const mockPartialIrrigationProgram = {
        name: 'Irrigation Program 1',
        duration: 10,
        wateringPeriod: 2,
        startTimes: ['12:00'],
        deviceIds: [1, 2],
        simultaneousIrrigation: true,
      }
      mockGet.mockResolvedValue({ _id: id, ...mockPartialIrrigationProgram } as IrrigationProgramEntity)
      const irrigationProgram = await service.findOne(id)
      expect(mockGet).toHaveBeenCalledWith(id)
      expect(irrigationProgram).toEqual({
        id: id,
        ...mockPartialIrrigationProgram,
      } as IrrigationProgram)
    })

    it('should not find a deleted irrigation program', async () => {
      const id = uuidv4()
      mockGet.mockResolvedValue({ _deleted: true })
      try {
        await service.findOne(id)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.NOT_FOUND)
      }
      expect(mockGet).toHaveBeenCalledWith(id)
    })

    it('should not find an irrigation program that does not exist', async () => {
      const id = uuidv4()
      mockGet.mockRejectedValue({ statusCode: HttpStatus.NOT_FOUND })
      try {
        await service.findOne(id)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.NOT_FOUND)
      }
      expect(mockGet).toHaveBeenCalledWith(id)
    })

    it('should not find an irrigation program because of an unknown error', async () => {
      const id = uuidv4()
      mockGet.mockRejectedValue({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR })
      try {
        await service.findOne(id)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      }
      expect(mockGet).toHaveBeenCalledWith(id)
    })
  })

  describe('update an irrigation program', () => {
    it('should update an irrigation program', async () => {
      const id = uuidv4()
      const rev = '1-234'
      const mockIrrigationProgram: IrrigationProgramEntity = {
        name: 'Irrigation Program 1',
        duration: 10,
        wateringPeriod: 2,
        startTimes: ['12:00'],
        deviceIds: [1, 2],
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
      } as IrrigationProgram)
    })

    it('should not update an irrigation program because the program has been deleted', async () => {
      const id = uuidv4()
      mockGet.mockResolvedValue({ _deleted: true })
      const mockUpdateDto: UpdateIrrigationProgramDto = {
        duration: 5,
        wateringPeriod: 1,
      }
      try {
        await service.update(id, mockUpdateDto)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.NOT_FOUND)
      }
      expect(mockGet).toHaveBeenCalledWith(id)
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('should not update an irrigation program because the program does not exist', async () => {
      const id = uuidv4()
      mockGet.mockRejectedValue({ statusCode: HttpStatus.NOT_FOUND })
      const mockUpdateDto: UpdateIrrigationProgramDto = {
        duration: 5,
        wateringPeriod: 1,
      }
      try {
        await service.update(id, mockUpdateDto)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.NOT_FOUND)
      }
      expect(mockGet).toHaveBeenCalledWith(id)
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('should not update an irrigation program because of an unknown error while looking up the program', async () => {
      const id = uuidv4()
      mockGet.mockRejectedValue({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR })
      const mockUpdateDto: UpdateIrrigationProgramDto = {
        duration: 5,
        wateringPeriod: 1,
      }
      try {
        await service.update(id, mockUpdateDto)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      }
      expect(mockGet).toHaveBeenCalledWith(id)
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('should not update an irrigation program because the update failed', async () => {
      const id = uuidv4()
      const rev = '1-234'
      const mockIrrigationProgram: IrrigationProgramEntity = {
        name: 'Irrigation Program 1',
        duration: 10,
        wateringPeriod: 2,
        startTimes: ['12:00'],
        deviceIds: [1, 2],
        simultaneousIrrigation: true,
      }
      mockGet.mockResolvedValue({ _id: id, _rev: rev, ...mockIrrigationProgram })
      mockInsert.mockResolvedValue({ ok: false })
      const mockUpdateDto: UpdateIrrigationProgramDto = {
        duration: 5,
        wateringPeriod: 1,
      }
      try {
        await service.update(id, mockUpdateDto)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      }
      expect(mockGet).toHaveBeenCalledWith(id)
      expect(mockInsert).toHaveBeenCalledWith({ _id: id, _rev: rev, ...mockIrrigationProgram, ...mockUpdateDto })
    })

    it('should not update an irrigation program because of an unknown error', async () => {
      const id = uuidv4()
      const rev = '1-234'
      const mockIrrigationProgram: IrrigationProgramEntity = {
        name: 'Irrigation Program 1',
        duration: 10,
        wateringPeriod: 2,
        startTimes: ['12:00'],
        deviceIds: [1, 2],
        simultaneousIrrigation: true,
      }
      mockGet.mockResolvedValue({ _id: id, _rev: rev, ...mockIrrigationProgram })
      mockInsert.mockRejectedValue({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR })
      const mockUpdateDto: UpdateIrrigationProgramDto = {
        duration: 5,
        wateringPeriod: 1,
      }
      try {
        await service.update(id, mockUpdateDto)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      }
      expect(mockGet).toHaveBeenCalledWith(id)
      expect(mockInsert).toHaveBeenCalledWith({ _id: id, _rev: rev, ...mockIrrigationProgram, ...mockUpdateDto })
    })
  })

  describe('remove an irrigation program', () => {
    it('should remove an irrigation program', async () => {
      const id = uuidv4()
      const rev = '1-234'
      mockHead.mockResolvedValue({ etag: rev })
      mockDestroy.mockResolvedValue({ ok: true, id, rev })
      await service.remove(id)
      expect(mockHead).toHaveBeenCalledWith(id)
      expect(mockDestroy).toHaveBeenCalledWith(id, rev)
    })

    it('should not remove an irrigation program because the revision cannot be found', async () => {
      const id = uuidv4()
      mockHead.mockRejectedValue({ statusCode: HttpStatus.NOT_FOUND })
      try {
        await service.remove(id)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.NOT_FOUND)
      }
      expect(mockHead).toHaveBeenCalledWith(id)
      expect(mockDestroy).not.toHaveBeenCalled()
    })

    it('should not remove an irrigation program because the deletion fails', async () => {
      const id = uuidv4()
      const rev = '1-234'
      mockHead.mockResolvedValue({ etag: rev })
      mockDestroy.mockRejectedValue({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR })
      try {
        await service.remove(id)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      }
      expect(mockHead).toHaveBeenCalledWith(id)
      expect(mockDestroy).toHaveBeenCalledWith(id, rev)
    })

    it('should not remove an irrigation program because deletion result is false', async () => {
      const id = uuidv4()
      const rev = '1-234'
      mockHead.mockResolvedValue({ etag: rev })
      mockDestroy.mockResolvedValue({ ok: false })
      try {
        await service.remove(id)
      } catch (error) {
        expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      }
      expect(mockHead).toHaveBeenCalledWith(id)
      expect(mockDestroy).toHaveBeenCalledWith(id, rev)
    })
  })
})

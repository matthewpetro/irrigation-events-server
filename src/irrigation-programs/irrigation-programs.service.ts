import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { CreateIrrigationProgramDto } from './dto/create-irrigation-program.dto'
import { UpdateIrrigationProgramDto } from './dto/update-irrigation-program.dto'
import { IrrigationProgramDto } from './dto/irrigation-program.dto'
import { IrrigationProgramEntity } from './entities/irrigation-program.entity'
import { ConfigService } from '@nestjs/config'
import EnvironmentVariables from '@/environment-variables'
import { DatabaseService } from '@/database/database.service'
import { DocumentScope, IdentifiedDocument, MaybeDocument } from 'nano'

type IrrigationProgramDocument = IrrigationProgramEntity & IdentifiedDocument

type IrrigationProgramMaybeDocument = IrrigationProgramEntity & MaybeDocument

const irrigationDocumentToDto = (irrigationProgram: IrrigationProgramDocument): IrrigationProgramDto => ({
  id: irrigationProgram._id,
  duration: irrigationProgram.duration,
  wateringPeriod: irrigationProgram.wateringPeriod,
  startTime: irrigationProgram.startTime,
  switches: irrigationProgram.switches,
  simultaneousIrrigation: irrigationProgram.simultaneousIrrigation,
  nextRunDate: irrigationProgram.nextRunDate,
})

const creationDtoToDocument = (irrigationProgramDto: CreateIrrigationProgramDto): IrrigationProgramMaybeDocument => ({
  duration: irrigationProgramDto.duration,
  wateringPeriod: irrigationProgramDto.wateringPeriod,
  startTime: irrigationProgramDto.startTime,
  switches: irrigationProgramDto.switches,
  simultaneousIrrigation: irrigationProgramDto.simultaneousIrrigation,
  nextRunDate: irrigationProgramDto.nextRunDate,
})

@Injectable()
export class IrrigationProgramsService implements OnModuleInit {
  private db: DocumentScope<IrrigationProgramMaybeDocument>

  public constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
    private databaseService: DatabaseService
  ) {}

  onModuleInit() {
    this.db = this.databaseService.getDatabaseConnection(
      this.configService.get('IRRIGATION_PROGRAMS_DB_NAME', { infer: true })
    )
  }

  async create(createIrrigationProgramDto: CreateIrrigationProgramDto) {
    try {
      const result = await this.db.insert(creationDtoToDocument(createIrrigationProgramDto), uuidv4())
      if (!result.ok) {
        throw new HttpException('Failed to create irrigation program', HttpStatus.INTERNAL_SERVER_ERROR)
      }
      return { id: result.id, ...createIrrigationProgramDto } as IrrigationProgramDto
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException('Failed to create irrigation program', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async findAll() {
    try {
      const result = await this.db.list({ include_docs: true })
      return result.rows.map((row) => irrigationDocumentToDto(row.doc!))
    } catch (error) {
      throw new HttpException('Failed to retrieve irrigation programs', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  private async findIrrigationProgramById(id: string) {
    try {
      const result = await this.db.get(id)
      if (result._deleted) {
        throw new HttpException(`Irrigation program with ID ${id} not found`, HttpStatus.NOT_FOUND)
      }
      return result
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      if (error.statusCode === 404) {
        throw new HttpException(`Irrigation program with ID ${id} not found`, HttpStatus.NOT_FOUND)
      }
      throw new HttpException(`Failed to retrieve irrigation program with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async findOne(id: string) {
    const result = await this.findIrrigationProgramById(id)
    return irrigationDocumentToDto(result)
  }

  async update(id: string, updateIrrigationProgramDto: UpdateIrrigationProgramDto) {
    const currentDocument = await this.findIrrigationProgramById(id)
    const newDocument = {
      ...currentDocument,
      ...updateIrrigationProgramDto,
    }
    try {
      const result = await this.db.insert(newDocument)
      if (!result.ok) {
        throw new HttpException(`Failed to update irrigation program with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
      return irrigationDocumentToDto(newDocument)
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new HttpException(`Failed to update irrigation program with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
      throw error
    }
  }

  async remove(id: string) {
    try {
      const { etag: revision } = await this.db.head(id)
      const result = await this.db.destroy(id, revision)
      return result.ok
    } catch (error) {
      if (error.statusCode === 404) {
        throw new HttpException(`Irrigation program with ID ${id} not found`, HttpStatus.NOT_FOUND)
      } else {
        throw new HttpException(`Failed to delete irrigation program with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
    }
  }
}

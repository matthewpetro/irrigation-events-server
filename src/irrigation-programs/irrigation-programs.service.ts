import { Injectable, OnModuleInit } from '@nestjs/common'
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
    const result = await this.db.insert(creationDtoToDocument(createIrrigationProgramDto))
    return result.ok ? ({ id: result.id, ...createIrrigationProgramDto } as IrrigationProgramDto) : null
  }

  async findAll() {
    const result = await this.db.list({ include_docs: true })
    return result.rows.map((row) => irrigationDocumentToDto(row.doc!))
  }

  async findOne(id: string) {
    const result = await this.db.get(id)
    return result && !result._deleted ? irrigationDocumentToDto(result) : null
  }

  async update(id: string, updateIrrigationProgramDto: UpdateIrrigationProgramDto) {
    const currentDocument = await this.db.get(id)
    if (!currentDocument || currentDocument._deleted) {
      return null
    }
    const newDocument: IrrigationProgramDocument = {
      ...currentDocument,
      ...updateIrrigationProgramDto,
    }
    const result = await this.db.insert(newDocument)
    return result.ok ? irrigationDocumentToDto(newDocument) : null
  }

  async remove(id: string) {
    const { etag: revision } = await this.db.head(id)
    const result = await this.db.destroy(id, revision)
    return result.ok
  }
}

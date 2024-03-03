import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import type { CreateIrrigationProgram, UpdateIrrigationProgram } from './types'
import { IrrigationProgramEntity } from './entities/irrigation-program.entity'
import { IrrigationProgram } from './interfaces/irrigation-program.interface'
import { ConfigService } from '@nestjs/config'
import EnvironmentVariables from '@/environment-variables'
import { DatabaseService } from '@/database/database.service'
import { DocumentScope, IdentifiedDocument, MaybeDocument, MaybeRevisionedDocument } from 'nano'

type IrrigationProgramEntityWithId = IrrigationProgramEntity & IdentifiedDocument

const irrigationEntityToIrrigationInterface = (
  irrigationProgramEntity: IrrigationProgramEntityWithId
): IrrigationProgram => ({
  id: irrigationProgramEntity._id,
  name: irrigationProgramEntity.name,
  duration: irrigationProgramEntity.duration,
  wateringPeriod: irrigationProgramEntity.wateringPeriod,
  startTime: irrigationProgramEntity.startTime,
  switches: irrigationProgramEntity.switches,
  simultaneousIrrigation: irrigationProgramEntity.simultaneousIrrigation,
  nextRunDate: irrigationProgramEntity.nextRunDate,
})

@Injectable()
export class IrrigationProgramsService implements OnModuleInit {
  private db: DocumentScope<IrrigationProgramEntity & MaybeDocument>

  public constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
    private databaseService: DatabaseService
  ) {}

  onModuleInit() {
    this.db = this.databaseService.getDatabaseConnection(
      this.configService.get('IRRIGATION_PROGRAMS_DB_NAME', { infer: true })
    )
  }

  async create(createIrrigationProgram: CreateIrrigationProgram) {
    try {
      const result = await this.db.insert(createIrrigationProgram as IrrigationProgramEntity, uuidv4())
      if (!result.ok) {
        throw new HttpException('Failed to create irrigation program', HttpStatus.INTERNAL_SERVER_ERROR)
      }
      return { id: result.id, ...createIrrigationProgram } as IrrigationProgram
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
      return result.rows.map((row) => irrigationEntityToIrrigationInterface(row.doc! as IrrigationProgramEntityWithId))
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
      return result as IrrigationProgramEntityWithId & MaybeRevisionedDocument
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
    return irrigationEntityToIrrigationInterface(result)
  }

  async update(id: string, updateIrrigationProgram: UpdateIrrigationProgram) {
    const currentDocument = await this.findIrrigationProgramById(id)
    const newDocument: IrrigationProgramEntityWithId = {
      ...currentDocument,
      ...updateIrrigationProgram,
    }
    try {
      const result = await this.db.insert(newDocument)
      if (!result.ok) {
        throw new HttpException(`Failed to update irrigation program with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
      return irrigationEntityToIrrigationInterface(newDocument)
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
      // The revision is wrapped in double quotes, so we need to remove them
      const trimmedRevision = revision.replace(/^"|"$/g, '')
      const result = await this.db.destroy(id, trimmedRevision)
      if (!result.ok) {
        throw new HttpException(`Failed to delete irrigation program with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      if (error.statusCode === 404) {
        throw new HttpException(`Irrigation program with ID ${id} not found`, HttpStatus.NOT_FOUND)
      } else {
        throw new HttpException(`Failed to delete irrigation program with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
    }
  }
}

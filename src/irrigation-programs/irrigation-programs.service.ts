import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import type { CreateIrrigationProgram, UpdateIrrigationProgram } from './types'
import { IrrigationProgramEntity } from './entities/irrigation-program.entity'
import { IrrigationProgram } from './interfaces/irrigation-program.interface'
import { ConfigService } from '@nestjs/config'
import EnvironmentVariables from '@/environment-variables'
import { DatabaseService } from '@/database/database.service'
import { DocumentScope, Document, MaybeDocument } from 'nano'

type IrrigationProgramDocument = IrrigationProgramEntity & Document

const irrigationEntityToIrrigationInterface = (
  irrigationProgramEntity: IrrigationProgramDocument
): IrrigationProgram => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, _rev, ...rest } = irrigationProgramEntity
  return {
    id: _id,
    ...rest,
  }
}

@Injectable()
export class IrrigationProgramsService implements OnModuleInit {
  private readonly logger = new Logger(IrrigationProgramsService.name)
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
        this.logger.error('Failed to create irrigation program', result)
        throw new HttpException('Failed to create irrigation program', HttpStatus.INTERNAL_SERVER_ERROR)
      }
      return { id: result.id, ...createIrrigationProgram } as IrrigationProgram
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      this.logger.error('Failed to create irrigation program', error)
      throw new HttpException('Failed to create irrigation program', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async findAll() {
    try {
      const result = await this.db.list({ include_docs: true })
      return result.rows.map((row) => irrigationEntityToIrrigationInterface(row.doc! as IrrigationProgramDocument))
    } catch (error) {
      this.logger.error('Failed to retrieve irrigation programs', error)
      throw new HttpException('Failed to retrieve irrigation programs', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  private async findIrrigationProgramById(id: string) {
    try {
      const result = await this.db.get(id)
      if (result._deleted) {
        this.logger.error(`Irrigation program with ID ${id} not found`)
        throw new HttpException(`Irrigation program with ID ${id} not found`, HttpStatus.NOT_FOUND)
      }
      return result as IrrigationProgramDocument
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      if (error.statusCode === 404) {
        this.logger.error(`Irrigation program with ID ${id} not found`)
        throw new HttpException(`Irrigation program with ID ${id} not found`, HttpStatus.NOT_FOUND)
      }
      this.logger.error(`Failed to retrieve irrigation program with ID ${id}`, error)
      throw new HttpException(`Failed to retrieve irrigation program with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async findOne(id: string) {
    const result = await this.findIrrigationProgramById(id)
    return irrigationEntityToIrrigationInterface(result)
  }

  async update(id: string, updateIrrigationProgram: UpdateIrrigationProgram) {
    const currentDocument = await this.findIrrigationProgramById(id)
    const newDocument: IrrigationProgramDocument = {
      ...currentDocument,
      ...updateIrrigationProgram,
    }
    try {
      const result = await this.db.insert(newDocument)
      if (!result.ok) {
        this.logger.error(`Failed to update irrigation program with ID ${id}`, result)
        throw new HttpException(`Failed to update irrigation program with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
      return irrigationEntityToIrrigationInterface(newDocument)
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      this.logger.error(`Failed to update irrigation program with ID ${id}`, error)
      throw new HttpException(`Failed to update irrigation program with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR)
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
        this.logger.error(`Irrigation program with ID ${id} not found`)
        throw new HttpException(`Irrigation program with ID ${id} not found`, HttpStatus.NOT_FOUND)
      } else {
        this.logger.error(`Failed to delete irrigation program with ID ${id}`, error)
        throw new HttpException(`Failed to delete irrigation program with ID ${id}`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
    }
  }
}

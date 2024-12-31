import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { DocumentScope, MaybeDocument } from 'nano'
import { ConfigService } from '@nestjs/config'
import { RainDelayDto } from './dto/rain-delay.dto'
import { RainDelay } from './entities/rain-delay.entity'
import { EnvironmentVariables } from '@/environment-variables'
import { DatabaseService } from '@/database/database.service'

const dtoToEntity = (rainDelayDto: RainDelayDto): RainDelay => new RainDelay(rainDelayDto.resumeWateringAfterDate)

@Injectable()
export class RainDelayService implements OnModuleInit {
  private readonly logger = new Logger(RainDelayService.name)

  private db: DocumentScope<RainDelay & MaybeDocument>

  private readonly rainDelayDocumentId: string

  public constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
    private databaseService: DatabaseService
  ) {
    this.rainDelayDocumentId = this.configService.get('RAIN_DELAY_DOCUMENT_ID', { infer: true })
  }

  onModuleInit() {
    this.db = this.databaseService.getDatabaseConnection(
      this.configService.get('SYSTEM_GLOBAL_INFO_DB_NAME', { infer: true })
    )
  }

  async get() {
    try {
      const result = await this.db.get(this.rainDelayDocumentId)
      return result.resumeWateringAfterDate
    } catch (error) {
      this.logger.error('Failed to get rain delay', error)
      throw new HttpException('Failed to get rain delay', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async update(rainDelayDto: RainDelayDto) {
    try {
      const result = await this.db.insert(dtoToEntity(rainDelayDto), this.rainDelayDocumentId)
      if (!result.ok) {
        this.logger.error('Failed to update rain delay', result)
        throw new HttpException('Failed to update rain delay', HttpStatus.INTERNAL_SERVER_ERROR)
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      this.logger.error('Failed to update rain delay', error)
      throw new HttpException('Failed to update rain delay', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async remove() {
    try {
      const result = await this.db.insert(new RainDelay(), this.rainDelayDocumentId)
      if (!result.ok) {
        this.logger.error('Failed to remove rain delay', result)
        throw new HttpException('Failed to remove rain delay', HttpStatus.INTERNAL_SERVER_ERROR)
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      this.logger.error('Failed to remove rain delay', error)
      throw new HttpException('Failed to remove rain delay', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}

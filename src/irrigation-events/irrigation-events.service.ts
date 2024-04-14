import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import Nano, { DocumentScope } from 'nano'
import { ConfigService } from '@nestjs/config'
import EnvironmentVariables from '@/environment-variables'
import { IrrigationEventDocument } from './entities/irrigation-event.entity'
import { IrrigationEvent } from './interfaces/irrigation-event.interface'
import * as queryBuilders from './queries'
import { MakerApiEventDto } from './dto/maker-api-event.dto'
import { parseISO } from 'date-fns'
import { DatabaseService } from '@/database/database.service'

const makerEventToIrrigationEvent = ({ displayName, value, deviceId }: MakerApiEventDto) =>
  ({
    _id: new Date().toISOString(),
    deviceName: displayName,
    state: value,
    deviceId,
  }) as IrrigationEventDocument

const dbDocumentToIrrigationEvent = ({ _id, deviceName, deviceId, state }: IrrigationEventDocument) =>
  ({
    timestamp: parseISO(_id),
    deviceName: deviceName,
    deviceId: deviceId,
    state: state,
  }) as IrrigationEvent

@Injectable()
export class IrrigationEventsService implements OnModuleInit {
  private readonly logger = new Logger(IrrigationEventsService.name)
  private db: DocumentScope<IrrigationEventDocument>

  public constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
    private databaseService: DatabaseService
  ) {}

  onModuleInit() {
    this.db = this.databaseService.getDatabaseConnection<IrrigationEventDocument>(
      this.configService.get<string>('IRRIGATION_EVENTS_DB_NAME', { infer: true })
    )
  }

  private async executeQuery(query: Nano.MangoQuery) {
    const result = await this.db.find(query)
    return result.docs
  }

  public async createIrrigationEvent(irrigationEvent: MakerApiEventDto) {
    try {
      const result = await this.db.insert(makerEventToIrrigationEvent(irrigationEvent))
      if (!result.ok) {
        this.logger.error('Failed to create irrigation event', result)
        throw new HttpException('Failed to create irrigation event', HttpStatus.INTERNAL_SERVER_ERROR)
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      this.logger.error('Failed to create irrigation event', error)
      throw new HttpException('Failed to create irrigation event', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  public async getIrrigationEvents(startTimestamp: string, endTimestamp: string) {
    try {
      const dbDocuments = await this.executeQuery(
        queryBuilders.irrigationEventsQueryBuilder(startTimestamp, endTimestamp)
      )
      return dbDocuments.map(dbDocumentToIrrigationEvent)
    } catch (error) {
      this.logger.error('Failed to retrieve irrigation events', error)
      throw new HttpException('Failed to retrieve irrigation events', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  public async getEventsBeforeStart(startTimestamp: string, deviceId: number) {
    try {
      const dbDocuments = await this.executeQuery(queryBuilders.eventsBeforeStartQueryBuilder(startTimestamp, deviceId))
      return dbDocuments.map(dbDocumentToIrrigationEvent)
    } catch (error) {
      this.logger.error('Failed to retreive events before start', error)
    }
    return []
  }

  public async getEventsAfterEnd(endTimestamp: string, deviceId: number) {
    try {
      const dbDocuments = await this.executeQuery(queryBuilders.eventsAfterEndQueryBuilder(endTimestamp, deviceId))
      return dbDocuments.map(dbDocumentToIrrigationEvent)
    } catch (error) {
      this.logger.error('Failed to retrieve events after end', error)
    }
    return []
  }
}

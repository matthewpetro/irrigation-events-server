import { Injectable, OnModuleInit } from '@nestjs/common'
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

  public async insertIrrigationEvent(irrigationEvent: MakerApiEventDto) {
    await this.db.insert(makerEventToIrrigationEvent(irrigationEvent))
  }

  public async getIrrigationEvents(startTimestamp: string, endTimestamp: string) {
    const dbDocuments = await this.executeQuery(
      queryBuilders.irrigationEventsQueryBuilder(startTimestamp, endTimestamp)
    )
    return dbDocuments.map(dbDocumentToIrrigationEvent)
  }

  public async getEventsBeforeStart(startTimestamp: string, deviceId: number) {
    const dbDocuments = await this.executeQuery(queryBuilders.eventsBeforeStartQueryBuilder(startTimestamp, deviceId))
    return dbDocuments.map(dbDocumentToIrrigationEvent)
  }

  public async getEventsAfterEnd(endTimestamp: string, deviceId: number) {
    const dbDocuments = await this.executeQuery(queryBuilders.eventsAfterEndQueryBuilder(endTimestamp, deviceId))
    return dbDocuments.map(dbDocumentToIrrigationEvent)
  }
}

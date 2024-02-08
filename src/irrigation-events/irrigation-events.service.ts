import { Injectable } from '@nestjs/common'
import Nano, { DocumentScope } from 'nano'
import { ConfigService } from '@nestjs/config'
import EnvironmentVariables from '@/environment-variables'
import { IrrigationEventDocument } from './interfaces/irrigation-event-document.interface'
import * as queryBuilders from './queries'

@Injectable()
export class IrrigationEventsService {
  private db: DocumentScope<IrrigationEventDocument>
  private intervalTimeout: NodeJS.Timeout

  public constructor(private configService: ConfigService<EnvironmentVariables, true>) {}

  async onModuleInit() {
    const nano = Nano({
      url: this.configService.get<string>('COUCHDB_URL', { infer: true }),
      requestDefaults: {
        jar: true,
      },
    })
    this.db = <DocumentScope<IrrigationEventDocument>>(
      nano.db.use(this.configService.get<string>('DB_NAME', { infer: true }))
    )

    // Use CouchDB's cookie authentication
    const nanoAuth = async () =>
      nano.auth(
        this.configService.get<string>('DB_USERNAME', { infer: true }),
        this.configService.get<string>('DB_PASSWORD', { infer: true })
      )
    await nanoAuth()

    const authRefreshMinutes: number = this.configService.get<number>('DB_AUTH_REFRESH_MINUTES', { infer: true })
    this.intervalTimeout = setInterval(nanoAuth, authRefreshMinutes * 60 * 1000)
  }

  onModuleDestroy() {
    clearInterval(this.intervalTimeout)
  }

  private async executeQuery(query: Nano.MangoQuery) {
    const result = await this.db.find(query)
    return result.docs
  }

  public async insertIrrigationEvent(irrigationEvent: IrrigationEventDocument) {
    await this.db.insert(irrigationEvent)
  }

  public async getIrrigationEvents(startTimestamp: string, endTimestamp: string) {
    return this.executeQuery(queryBuilders.irrigationEventsQueryBuilder(startTimestamp, endTimestamp))
  }

  public async getEventsBeforeStart(startTimestamp: string, deviceId: number) {
    return this.executeQuery(queryBuilders.eventsBeforeStartQueryBuilder(startTimestamp, deviceId))
  }

  public async getEventsAfterEnd(endTimestamp: string, deviceId: number) {
    return this.executeQuery(queryBuilders.eventsAfterEndQueryBuilder(endTimestamp, deviceId))
  }
}

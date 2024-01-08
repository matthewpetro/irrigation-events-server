import Nano, { DocumentScope } from 'nano'
import { IrrigationEventDocument } from './types.js'
import irrigationEventsQueryBuilder from './queries/irrigationEvents.js'
import eventsBeforeStartQueryBuilder from './queries/eventsBeforeStart.js'
import eventsAfterEndQueryBuilder from './queries/eventsAfterEnd.js'

export interface DatabaseFunctions {
  insertIrrigationEvent: (
    irrigationEvent: IrrigationEventDocument
  ) => Promise<Nano.DocumentInsertResponse>
  getIrriationEvents: (
    startTimestamp: string,
    endTimestamp: string
  ) => Promise<Nano.MangoResponse<IrrigationEventDocument>>
  getEventsBeforeStart: (
    startTimestamp: string,
    deviceId: number
  ) => Promise<Nano.MangoResponse<IrrigationEventDocument>>
  getEventsAfterEnd: (
    endTimestamp: string,
    deviceId: number
  ) => Promise<Nano.MangoResponse<IrrigationEventDocument>>
}

class DbFunctions implements DatabaseFunctions {
  private static instance: DbFunctions | null = null

  private db: DocumentScope<IrrigationEventDocument>

  private constructor() {
    const nano = Nano({
      url: process.env.COUCHDB_URL as string,
      requestDefaults: {
        jar: true,
      },
    })
    this.db = <DocumentScope<IrrigationEventDocument>>nano.db.use(process.env.DB_NAME as string)

    // Use CouchDB's cookie authentication
    const nanoAuth = async () =>
      nano.auth(process.env.DB_USERNAME as string, process.env.DB_PASSWORD as string)
    nanoAuth()

    const authRefreshMinutes = process.env.DB_AUTH_REFRESH_MINUTES
      ? parseInt(process.env.DB_AUTH_REFRESH_MINUTES, 10)
      : 5
    setInterval(nanoAuth, authRefreshMinutes * 60 * 1000)
  }

  public static getInstance(): DatabaseFunctions {
    if (!this.instance) {
      this.instance = new DbFunctions()
    }
    return this.instance
  }

  public async insertIrrigationEvent(irrigationEvent: IrrigationEventDocument) {
    return this.db.insert(irrigationEvent)
  }

  public async getIrriationEvents(startTimestamp: string, endTimestamp: string) {
    const query = irrigationEventsQueryBuilder(startTimestamp, endTimestamp)
    return this.db.find(query)
  }

  public async getEventsBeforeStart(startTimestamp: string, deviceId: number) {
    const query = eventsBeforeStartQueryBuilder(startTimestamp, deviceId)
    return this.db.find(query)
  }

  public async getEventsAfterEnd(endTimestamp: string, deviceId: number) {
    const query = eventsAfterEndQueryBuilder(endTimestamp, deviceId)
    return this.db.find(query)
  }
}

export default DbFunctions

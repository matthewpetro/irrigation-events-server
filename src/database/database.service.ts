import EnvironmentVariables from '@/environment-variables'
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Nano, { DocumentScope } from 'nano'

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private nano: ReturnType<typeof Nano>
  private intervalTimeout: NodeJS.Timeout

  public constructor(private configService: ConfigService<EnvironmentVariables, true>) {}

  async onModuleInit() {
    this.nano = Nano({
      url: this.configService.get<string>('COUCHDB_URL', { infer: true }),
      requestDefaults: {
        jar: true,
      },
    })

    // Use CouchDB's cookie authentication
    const nanoAuth = async () =>
      this.nano.auth(
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

  public getDatabaseConnection<DocumentType>(databaseName: string) {
    return <DocumentScope<DocumentType>>this.nano.db.use(databaseName)
  }
}

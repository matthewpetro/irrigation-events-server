import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Nano, { DocumentScope, MaybeDocument } from 'nano'
import { EnvironmentVariables } from '@/environment-variables'

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

    const authRefreshMinutes: number = parseInt(this.configService.get('DB_AUTH_REFRESH_MINUTES'))
    this.intervalTimeout = setInterval(nanoAuth, authRefreshMinutes * 60 * 1000)
  }

  onModuleDestroy() {
    clearInterval(this.intervalTimeout)
  }

  public getDatabaseConnection<T extends MaybeDocument>(databaseName: string) {
    return <DocumentScope<T>>this.nano.db.use(databaseName)
  }
}

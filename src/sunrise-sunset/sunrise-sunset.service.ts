import { DatabaseService } from '@/database/database.service'
import EnvironmentVariables from '@/environment-variables'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentScope } from 'nano'
import { SunriseSunsetDocument } from './interfaces/sunrise-sunset-document.interface'
import axios, { AxiosInstance } from 'axios'

type SunriseSunsetResponse =
  | {
      results: {
        sunrise: string
        sunset: string
        solar_noon: string
        day_length: number
        civil_twilight_begin: string
        civil_twilight_end: string
        nautical_twilight_begin: string
        nautical_twilight_end: string
        astronomical_twilight_begin: string
        astronomical_twilight_end: string
      }
      status: string
      tzid: string
    }
  | undefined

@Injectable()
export class SunriseSunsetService implements OnModuleInit {
  private axiosInstance: AxiosInstance
  private db: DocumentScope<SunriseSunsetDocument>

  public constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
    private databaseService: DatabaseService
  ) {}

  onModuleInit() {
    this.axiosInstance = axios.create({
      baseURL: this.configService.get<string>('SUNRISE_SUNSET_API_URL', { infer: true }),
      params: {
        lat: this.configService.get<number>('LATITUDE', { infer: true }),
        lng: this.configService.get<number>('LONGITUDE', { infer: true }),
        formatted: 0,
      },
    })
    this.db = this.databaseService.getDatabaseConnection(
      this.configService.get<SunriseSunsetDocument>('SUNRISE_SUNSET_DB_NAME', { infer: true })
    )
  }

  private async getSunriseSunsetFromApi(date: string): Promise<SunriseSunsetResponse> {
    const response = await this.axiosInstance.get<SunriseSunsetResponse>('/', { params: { date } })
    return response.data
  }
}

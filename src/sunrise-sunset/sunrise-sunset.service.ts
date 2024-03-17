import { DatabaseService } from '@/database/database.service'
import EnvironmentVariables from '@/environment-variables'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentScope } from 'nano'
import axios, { AxiosInstance } from 'axios'
import { SunriseSunsetEntity } from './entities/sunrise-sunset.entity'
import { SunriseSunsetResponse } from './interfaces/sunrise-sunset-response.interface'
import { sunriseSunsetQueryBuilder } from './queries'
import { addDays, format, isBefore, isEqual, parseISO } from 'date-fns'
import type { SunriseSunsets } from './interfaces/sunrise-sunset.interface'

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd')

const sunriseSunsetToDbDocument = ({ results }: SunriseSunsetResponse) => {
  const { sunrise, sunset } = results
  return {
    // The ID is the date of the sunrise/sunset.
    // Slicing off the first 10 characters gives us that without having to
    // parse and reformat the date.
    _id: sunrise.slice(0, 10),
    sunrise,
    sunset,
  } as SunriseSunsetEntity
}

const dbDocumentsToSunriseSunsets = (documents: SunriseSunsetEntity[]) =>
  documents.reduce((accumulator, document) => {
    accumulator.set(document._id, {
      sunrise: parseISO(document.sunrise),
      sunset: parseISO(document.sunset),
    })
    return accumulator
  }, new Map() as SunriseSunsets)

@Injectable()
export class SunriseSunsetService implements OnModuleInit {
  private axiosInstance: AxiosInstance
  private db: DocumentScope<SunriseSunsetEntity>

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
      this.configService.get<SunriseSunsetEntity>('SUNRISE_SUNSET_DB_NAME', { infer: true })
    )
  }

  public async getSunriseSunset(date: Date) {
    const sunriseSunsets = await this.getSunriseSunsets(date, date)
    return sunriseSunsets.get(formatDate(date))!
  }

  public async getSunriseSunsets(startDate: Date, endDate: Date) {
    const dbDocs = await this.getSunriseSunsetsFromDb(formatDate(startDate), formatDate(endDate))
    const sunriseSunsets = dbDocumentsToSunriseSunsets(dbDocs)

    // Iterate through each day between the start and end dates
    for (let date = startDate; isBefore(date, endDate) || isEqual(date, endDate); date = addDays(date, 1)) {
      const dateString = formatDate(date)

      // If we don't have a sunrise/sunset for the date, fetch it from the API,
      // save it to the database and add to the sunriseSunsets object.
      if (!sunriseSunsets.has(dateString)) {
        const sunriseSunsetResponse = await this.getSunriseSunsetFromApi(dateString)
        sunriseSunsets.set(dateString, {
          sunrise: parseISO(sunriseSunsetResponse.results.sunrise),
          sunset: parseISO(sunriseSunsetResponse.results.sunset),
        })
        // We don't need to wait for the insert to complete, so we don't await it.
        // If it fails, log it and move on.
        this.insertSunriseSunset(sunriseSunsetToDbDocument(sunriseSunsetResponse)).catch((e) => {
          console.error(e, `Failed to insert sunrise/sunset for ${dateString}`)
        })
      }
    }
    return sunriseSunsets
  }

  private async getSunriseSunsetFromApi(date: string) {
    const response = await this.axiosInstance.get<SunriseSunsetResponse>('', { params: { date } })
    return response.data
  }

  private async getSunriseSunsetsFromDb(startDate: string, endDate: string) {
    const result = await this.db.find(sunriseSunsetQueryBuilder(startDate, endDate))
    return result.docs
  }

  private async insertSunriseSunset(sunriseSunsetDocument: SunriseSunsetEntity) {
    await this.db.insert(sunriseSunsetDocument)
  }
}

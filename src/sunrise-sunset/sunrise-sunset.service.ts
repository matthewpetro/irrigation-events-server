import { DatabaseService } from '@/database/database.service'
import EnvironmentVariables from '@/environment-variables'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentScope } from 'nano'
import axios, { AxiosInstance } from 'axios'
import { SunriseSunsetDocument } from './interfaces/sunrise-sunset-document.interface'
import { SunriseSunsetResponse } from './interfaces/sunrise-sunset-response.interface'
import { sunriseSunsetQueryBuilder } from './queries'
import { addDays, format, parseISO } from 'date-fns'
import { SunriseSunsets } from './interfaces/sunrise-sunset.interface'

const sunriseSunsetToDbDocument = ({ results }: SunriseSunsetResponse) => {
  const { sunrise, sunset } = results
  return {
    // The ID is the date of the sunrise/sunset.
    // Slicing off the first 10 characters gives us that without having to
    // parse and reformat the date.
    _id: sunrise.slice(0, 10),
    sunrise,
    sunset,
  } as SunriseSunsetDocument
}

const dbDocumentsToSunriseSunsets = (documents: SunriseSunsetDocument[]) =>
  documents.reduce((accumulator, document) => {
    accumulator[document._id] = {
      sunrise: document.sunrise,
      sunset: document.sunset,
    }
    return accumulator
  }, {} as SunriseSunsets)

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
        tzid: 'America/Phoenix',
      },
    })
    this.db = this.databaseService.getDatabaseConnection(
      this.configService.get<SunriseSunsetDocument>('SUNRISE_SUNSET_DB_NAME', { infer: true })
    )
  }

  public async getSunriseSunsets(startDate: string, endDate: string) {
    const dbDocs = await this.getSunriseSunsetsFromDb(startDate, endDate)
    const sunriseSunsets = dbDocumentsToSunriseSunsets(dbDocs)

    const start = parseISO(startDate)
    const end = parseISO(endDate)

    // Iterate through each day between the start and end dates
    for (let date = start; date <= end; date = addDays(date, 1)) {
      const dateString = format(date, 'yyyy-MM-dd')

      // If we don't have a sunrise/sunset for the date, fetch it from the API,
      // save it to the database and add to the sunriseSunsets object.
      if (!sunriseSunsets[dateString]) {
        const sunriseSunsetResponse = await this.getSunriseSunsetFromApi(dateString)
        sunriseSunsets[dateString] = {
          sunrise: sunriseSunsetResponse.results.sunrise,
          sunset: sunriseSunsetResponse.results.sunset,
        }
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

  private async insertSunriseSunset(sunriseSunsetDocument: SunriseSunsetDocument) {
    await this.db.insert(sunriseSunsetDocument)
  }
}

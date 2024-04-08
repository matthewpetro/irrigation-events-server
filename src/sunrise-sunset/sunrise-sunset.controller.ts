import { Controller, Get, Query } from '@nestjs/common'
import { IsISO8601 } from 'class-validator'
import { SunriseSunsetService } from './sunrise-sunset.service'
import { parseISO } from 'date-fns'

// TODO: Remove this controller when no longer needed for testing purposes
class QueryParameters {
  @IsISO8601()
  startDate: string
  @IsISO8601()
  endDate: string
}

@Controller('sunrise-sunset')
export class SunriseSunsetController {
  constructor(private sunriseSunsetService: SunriseSunsetService) {}

  @Get()
  async get(@Query() { startDate, endDate }: QueryParameters) {
    const result = await this.sunriseSunsetService.getSunriseSunsets(parseISO(startDate), parseISO(endDate))
    return Object.fromEntries(result)
  }

  @Get('one')
  async getOne(@Query('date') date: string) {
    const result = await this.sunriseSunsetService.getSunriseSunset(parseISO(date))
    return result
  }
}

/* eslint-disable max-classes-per-file */
import { CanActivate, Controller, Get, Injectable, Query, UseGuards } from '@nestjs/common'
import { IsISO8601 } from 'class-validator'
import { parseISO } from 'date-fns'
import { SunriseSunsetService } from './sunrise-sunset.service'

// Use a guard to prevent this controller from being called in a non-development environment
@Injectable()
class DevelopmentGuard implements CanActivate {
  canActivate = () => process.env.NODE_ENV === 'development'
}

class QueryParameters {
  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string
}

// TODO: Remove this controller when no longer needed for testing purposes
@Controller('sunrise-sunset')
@UseGuards(DevelopmentGuard)
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

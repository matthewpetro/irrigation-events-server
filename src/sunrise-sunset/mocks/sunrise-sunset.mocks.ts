import { parseISO } from 'date-fns'
import { SunriseSunsetEntity } from '../entities/sunrise-sunset.entity'
import { SunriseSunsetResponse } from '../interfaces/sunrise-sunset-response.interface'
import { SunriseSunsets } from '../interfaces/sunrise-sunset.interface'

export const mockStartDate = parseISO('2024-01-01')
export const mockEndDate = parseISO('2024-01-03')

export const mockEntities: SunriseSunsetEntity[] = [
  { _id: '2024-01-01', sunrise: '2024-01-01T07:00:00-07:00', sunset: '2024-01-01T19:00:00-07:00' },
  { _id: '2024-01-02', sunrise: '2024-01-02T07:01:00-07:00', sunset: '2024-01-02T19:01:00-07:00' },
  { _id: '2024-01-03', sunrise: '2024-01-03T07:02:00-07:00', sunset: '2024-01-03T19:02:00-07:00' },
]

export const mockApiResponses: { [key: string]: SunriseSunsetResponse } = {
  '2024-01-01': {
    results: {
      sunrise: '2024-01-01T07:00:00-07:00',
      sunset: '2024-01-01T19:00:00-07:00',
    },
  },
  '2024-01-02': {
    results: {
      sunrise: '2024-01-02T07:01:00-07:00',
      sunset: '2024-01-02T19:01:00-07:00',
    },
  },
  '2024-01-03': {
    results: {
      sunrise: '2024-01-03T07:02:00-07:00',
      sunset: '2024-01-03T19:02:00-07:00',
    },
  },
}

export const mockSunriseSunsets: SunriseSunsets = new Map([
  ['2024-01-01', { sunrise: parseISO('2024-01-01T07:00:00-07:00'), sunset: parseISO('2024-01-01T19:00:00-07:00') }],
  ['2024-01-02', { sunrise: parseISO('2024-01-02T07:01:00-07:00'), sunset: parseISO('2024-01-02T19:01:00-07:00') }],
  ['2024-01-03', { sunrise: parseISO('2024-01-03T07:02:00-07:00'), sunset: parseISO('2024-01-03T19:02:00-07:00') }],
])

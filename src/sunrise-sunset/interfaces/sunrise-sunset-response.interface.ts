export interface SunriseSunsetResponse {
  results: {
    sunrise: string
    sunset: string
    solar_noon?: string
    day_length?: number
    civil_twilight_begin?: string
    civil_twilight_end?: string
    nautical_twilight_begin?: string
    nautical_twilight_end?: string
    astronomical_twilight_begin?: string
    astronomical_twilight_end?: string
  }
  status?: string
  tzid?: string
}

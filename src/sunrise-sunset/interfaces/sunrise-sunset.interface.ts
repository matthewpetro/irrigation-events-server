export interface SunriseSunset {
  sunrise: string
  sunset: string
}

export interface SunriseSunsets {
  [date: string]: SunriseSunset
}

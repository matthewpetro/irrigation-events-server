import { IdentifiedDocument } from 'nano'

export interface SunriseSunsetDocument extends IdentifiedDocument {
  sunrise: string
  sunset: string
}

import { IdentifiedDocument } from 'nano'

export class SunriseSunsetDocument implements IdentifiedDocument {
  _id: string
  sunrise: string
  sunset: string
}

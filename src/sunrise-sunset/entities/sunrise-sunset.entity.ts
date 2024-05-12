import { IdentifiedDocument } from 'nano'

export class SunriseSunsetEntity implements IdentifiedDocument {
  _id: string

  sunrise: string

  sunset: string
}

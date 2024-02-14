import { MaybeDocument } from 'nano'

export interface SunriseSunsetDocument extends MaybeDocument {
  _id: string
  sunrise: string
  sunset: string
}

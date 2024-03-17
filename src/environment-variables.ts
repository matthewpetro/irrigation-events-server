export default interface EnvironmentVariables {
  COUCHDB_URL: string
  DB_USERNAME: string
  DB_PASSWORD: string
  DB_AUTH_REFRESH_MINUTES: number

  MAKER_API_URL: string
  MAKER_API_ACCESS_TOKEN: string

  IRRIGATION_EVENTS_DB_NAME: string

  IRRIGATION_PROGRAMS_DB_NAME: string

  SUNRISE_SUNSET_DB_NAME: string
  SUNRISE_SUNSET_API_URL: string
  LATITUDE: number
  LONGITUDE: number

  SWITCH_METERING_INTERVAL: number
}

export interface EnvironmentVariables {
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

  // Amount of time to wait after turning on a switch on or off before
  // continuing to process switch changes
  SWITCH_METERING_INTERVAL: number

  // The times to use for sunrise and sunset if the actual
  // times cannot be retrieved from the database or API.
  DEFAULT_SUNRISE_TIME: string
  DEFAULT_SUNSET_TIME: string
}

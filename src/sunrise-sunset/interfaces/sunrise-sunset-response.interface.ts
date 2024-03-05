export interface SunriseSunsetResponse {
  results: {
    // Sunrise and sunset are ISO 8601 formatted strings
    sunrise: string
    sunset: string
  }
}

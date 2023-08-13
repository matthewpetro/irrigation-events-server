import Nano, { DocumentScope } from 'nano'
import { IrrigationEventDocument } from './types.js'

const nano = Nano({
  url: process.env.COUCHDB_URL as string,
  requestDefaults: {
    jar: true,
  },
})
const db = <DocumentScope<IrrigationEventDocument>>nano.db.use(process.env.DB_NAME as string)

// Use CouchDB's cookie authentication
const nanoAuth = async () =>
  nano.auth(process.env.DB_USERNAME as string, process.env.DB_PASSWORD as string)
await nanoAuth()

const authRefreshMinutes = process.env.DB_AUTH_REFRESH_MINUTES
  ? parseInt(process.env.DB_AUTH_REFRESH_MINUTES, 10)
  : 9
setInterval(nanoAuth, authRefreshMinutes * 60 * 1000)

export default db

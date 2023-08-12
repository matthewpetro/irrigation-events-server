import { Request, Response } from 'express'
import Nano from 'nano'

const nano = Nano({
  url: process.env.COUCHDB_URL as string,
  requestDefaults: {
    jar: true,
  },
})
const db = nano.db.use(process.env.DB_NAME as string)

// Use CouchDB's cookie authentication
const nanoAuth = async () =>
  nano.auth(process.env.DB_USERNAME as string, process.env.DB_PASSWORD as string)
await nanoAuth()

const authRefreshMinutes = process.env.DB_AUTH_REFRESH_MINUTES
  ? parseInt(process.env.DB_AUTH_REFRESH_MINUTES, 10)
  : 9
setInterval(nanoAuth, authRefreshMinutes * 60 * 1000)

type MakerApiEventContent = {
  name: string
  value: string
  displayName: string
  deviceId: string
  descriptionText: string
  unit: string | null
  type: string
  data: string | null
}

type MakerApiEvent = {
  content: MakerApiEventContent
}

const DeviceState = {
  ON: 'on',
  OFF: 'off',
} as const

// eslint-disable-next-line @typescript-eslint/no-redeclare
type DeviceState = (typeof DeviceState)[keyof typeof DeviceState]

interface IrrigationEvent extends Nano.MaybeDocument {
  _id: string
  deviceName: string
  deviceId: number
  state: DeviceState
}

const makerEventToIrrigationEvent = (event: MakerApiEvent): IrrigationEvent => {
  const { displayName, value, deviceId } = event.content
  return {
    _id: new Date().toISOString(),
    deviceName: displayName,
    deviceId: parseInt(deviceId, 10),
    state: value === 'on' ? DeviceState.ON : DeviceState.OFF,
  }
}

export default async function sendEventToDb(req: Request, res: Response) {
  const event: MakerApiEvent = req.body
  console.log(req.body)
  const irrigationEvent = makerEventToIrrigationEvent(event)
  console.log(irrigationEvent)
  try {
    await db.insert(irrigationEvent)
  } catch (error) {
    console.error(error)
  }
  res.status(200).end()
}

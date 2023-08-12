import { Request, Response, NextFunction } from 'express'
import Nano from 'nano'

const db = Nano(process.env.COUCHDB_URL as string).use(process.env.DB_NAME as string)

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
  deviceName: string
  deviceId: number
  state: DeviceState
  timestamp: number
}

const makerEventToIrrigationEvent = (event: MakerApiEvent): IrrigationEvent => {
  const { displayName, value, deviceId } = event.content
  return {
    deviceName: displayName,
    deviceId: parseInt(deviceId, 10),
    state: value === 'on' ? DeviceState.ON : DeviceState.OFF,
    timestamp: Date.now(),
  }
}

export default async function sendEventToDb(req: Request, res: Response, next: NextFunction) {
  const event: MakerApiEvent = req.body
  res.status(200).end()
  console.log(req.body)
  const irrigationEvent = makerEventToIrrigationEvent(event)
  console.log(irrigationEvent)
  // try {
  //   await db.insert(irrigationEvent)
  // } catch (error) {
  //   console.error(error)
  // }
  next()
}

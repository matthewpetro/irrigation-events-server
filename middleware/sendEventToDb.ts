import { Request, Response } from 'express'
import { DeviceState, IrrigationEventDocument } from '../types.js'
import db from '../database.js'

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

const makerEventToIrrigationEvent = (event: MakerApiEvent): IrrigationEventDocument => {
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
  const irrigationEvent = makerEventToIrrigationEvent(event)
  try {
    await db.insert(irrigationEvent)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
  }
  res.status(200).end()
}

import { Request, Response } from 'express'
import { z } from 'zod'
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

const makerApiEventContentSchema = z.object({
  name: z.literal('switch'),
  displayName: z.string(),
  deviceId: z.string().regex(/^\d+$/, 'Device ID must be a number'),
  value: z.nativeEnum(DeviceState),
})
const makerApiEventSchema = z.object({ content: makerApiEventContentSchema })

const makerEventToIrrigationEvent = (event: MakerApiEvent): IrrigationEventDocument => {
  const { displayName, value, deviceId } = event.content
  return {
    _id: new Date().toISOString(),
    deviceName: displayName,
    deviceId: parseInt(deviceId, 10),
    state: value as DeviceState,
  }
}

export default async function sendEventToDb(req: Request, res: Response) {
  const zodResult = makerApiEventSchema.passthrough().safeParse(req.body)
  if (!zodResult.success) {
    // eslint-disable-next-line no-console
    console.error(zodResult.error.issues)
    res.status(400).send(zodResult.error.issues)
    return
  }
  try {
    const irrigationEvent = makerEventToIrrigationEvent(zodResult.data as MakerApiEvent)
    await db.insert(irrigationEvent)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
  }
  res.status(200).end()
}

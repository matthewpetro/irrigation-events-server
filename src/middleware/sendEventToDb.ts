import { Request, Response } from 'express'
import { z } from 'zod'
import { DatabaseFunctions } from '../database.js'
import { DeviceState, IrrigationEventDocument } from '../types.js'

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

const makerEventToIrrigationEvent = (event: MakerApiEvent): IrrigationEventDocument => ({
  _id: new Date().toISOString(),
  deviceName: event.content.displayName,
  deviceId: parseInt(event.content.deviceId, 10),
  state: event.content.value as DeviceState,
})

class SendEventToDb {
  private dbFunctions: DatabaseFunctions

  constructor(dbFunctions: DatabaseFunctions) {
    this.dbFunctions = dbFunctions
  }

  public readonly sendEventToDb = async (req: Request, res: Response) => {
    const zodResult = makerApiEventSchema.passthrough().safeParse(req.body)
    if (!zodResult.success) {
      // eslint-disable-next-line no-console
      console.error(zodResult.error.issues)
      res.status(400).send(zodResult.error.issues)
      return
    }
    try {
      const irrigationEvent = makerEventToIrrigationEvent(zodResult.data as MakerApiEvent)
      await this.dbFunctions.insertIrrigationEvent(irrigationEvent)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
    }
    res.status(200).end()
  }
}

export default SendEventToDb

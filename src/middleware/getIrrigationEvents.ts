import { Request, Response } from 'express'
import { parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { z } from 'zod'
import { DeviceState, IrrigationEventDocument } from '../types.js'
import db from '../database.js'
import viewmodelBuilder from '../viewmodels/irrigationEvent.js'
import irrigationEventsQueryBuilder from '../queries/irrigationEvents.js'
import eventsBeforeStartQueryBuilder from '../queries/eventsBeforeStart.js'
import eventsAfterEndQueryBuilder from '../queries/eventsAfterEnd.js'

const timestampSchema = z
  .string({ required_error: 'Timestamp is required', invalid_type_error: 'Must be a datetime' })
  .datetime({ offset: true, message: 'Invalid datetime string' })
  .transform((timestamp) =>
    formatInTimeZone(parseISO(timestamp), 'Z', "yyyy-MM-dd'T'HH:mm:ss.SSSX")
  )

const queryParamsSchema = z
  .object({ startTimestamp: timestampSchema, endTimestamp: timestampSchema })
  .required()

const shouldPrependAdditionalOnEvent = (events: IrrigationEventDocument[]) =>
  events && events.length >= 1 && events[0].state === DeviceState.ON

const shouldAppendAdditionalOffEvent = (events: IrrigationEventDocument[]) =>
  events && events.length >= 1 && events[0].state === DeviceState.OFF

async function validateDeviceEventLists(
  dbDocuments: IrrigationEventDocument[],
  startTimestamp: string,
  endTimestamp: string
): Promise<IrrigationEventDocument[][]> {
  const deviceEventLists = Object.entries(
    dbDocuments.reduce(
      (accumulator, event) => {
        const deviceId = event.deviceId.toString()
        if (!accumulator[deviceId]) {
          accumulator[deviceId] = []
        }
        accumulator[deviceId].push(event)
        return accumulator
      },
      {} as { [deviceId: string]: IrrigationEventDocument[] }
    )
  )

  const appendOnEventPromises = deviceEventLists.map(
    async ([deviceId, deviceEvents]) => {
      if (deviceEvents[0].state !== DeviceState.ON) {
        // eslint-disable-next-line no-underscore-dangle
        const query = eventsBeforeStartQueryBuilder(startTimestamp, parseInt(deviceId, 10))
        const dbResponse = await db.find(query)
        if (shouldPrependAdditionalOnEvent(dbResponse.docs)) {
          deviceEvents.unshift(dbResponse.docs[0])
        }
      }
    }
  )
  await Promise.allSettled(appendOnEventPromises)

  const appendOffEventPromises = deviceEventLists.map(
    async ([deviceId, deviceEvents]) => {
      if (deviceEvents[deviceEvents.length - 1].state !== DeviceState.OFF) {
        // eslint-disable-next-line no-underscore-dangle
        const query = eventsAfterEndQueryBuilder(endTimestamp, parseInt(deviceId, 10))
        const dbResponse = await db.find(query)
        if (shouldAppendAdditionalOffEvent(dbResponse.docs)) {
          deviceEvents.push(dbResponse.docs[0])
        }
      }
    }
  )
  await Promise.allSettled(appendOffEventPromises)

  return deviceEventLists.map(([, deviceEvents]) => deviceEvents)
}

export default async function getIrrigationEvents(req: Request, res: Response) {
  const zodResult = queryParamsSchema.safeParse(req.query)
  if (!zodResult.success) {
    // eslint-disable-next-line no-console
    console.error(zodResult.error.issues)
    res.status(400).send(zodResult.error.issues)
    return
  }
  try {
    const { startTimestamp, endTimestamp } = zodResult.data
    const query = irrigationEventsQueryBuilder(startTimestamp, endTimestamp)
    const dbResponse = await db.find(query)
    const eventLists = await validateDeviceEventLists(dbResponse.docs, startTimestamp, endTimestamp)
    const viewmodel = viewmodelBuilder(eventLists)
    res.status(200).json(viewmodel)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500).send('Internal server error')
  }
}

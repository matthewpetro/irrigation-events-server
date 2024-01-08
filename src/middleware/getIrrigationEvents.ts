import { Request, Response } from 'express'
import { isWithinInterval, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { z } from 'zod'
import { DatabaseFunctions } from '../database.js'
import { DeviceState, IrrigationEventDocument } from '../types.js'
import getAllDeviceStates from '../makerApi.js'
import viewmodelBuilder from '../viewmodels/irrigationEvent.js'

type DeviceEventLists = { [deviceId: string]: IrrigationEventDocument[] }

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

const isCurrentTimeWithinInterval = (startTimestamp: string, endTimestamp: string) =>
  isWithinInterval(Date.now(), { start: parseISO(startTimestamp), end: parseISO(endTimestamp) })

// Split the list of events into lists by deviceId
const createDeviceEventLists = (dbDocuments: IrrigationEventDocument[]): DeviceEventLists =>
  dbDocuments.reduce(
    (accumulator, event) => {
      const deviceId = event.deviceId.toString()
      if (!accumulator[deviceId]) {
        accumulator[deviceId] = []
      }
      accumulator[deviceId].push(event)
      return accumulator
    },
    // I'd like to leave deviceId as a number, but Object.entries()
    // would convert it to a string.
    {} as { [deviceId: string]: IrrigationEventDocument[] }
  )

class GetIrrigationEvents {
  private dbFunctions: DatabaseFunctions

  constructor(dbFunctions: DatabaseFunctions) {
    this.dbFunctions = dbFunctions
  }

  public readonly getIrrigationEvents = async (req: Request, res: Response) => {
    const zodResult = queryParamsSchema.safeParse(req.query)
    if (!zodResult.success) {
      // eslint-disable-next-line no-console
      console.error(zodResult.error.issues)
      res.status(400).send(zodResult.error.issues)
      return
    }
    try {
      const { startTimestamp, endTimestamp } = zodResult.data
      const { docs } = await this.dbFunctions.getIrriationEvents(startTimestamp, endTimestamp)
      const deviceEventLists = createDeviceEventLists(docs)
      const eventLists = await this.addMissingEvents(deviceEventLists, startTimestamp, endTimestamp)
      const currentDeviceStates = isCurrentTimeWithinInterval(startTimestamp, endTimestamp)
        ? await getAllDeviceStates()
        : {}
      const viewmodel = viewmodelBuilder(eventLists, currentDeviceStates)
      res.status(200).json(viewmodel)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      res.status(500).send('Internal server error')
    }
  }

  private readonly addMissingEvents = async (
    deviceEventLists: DeviceEventLists,
    startTimestamp: string,
    endTimestamp: string
  ): Promise<IrrigationEventDocument[][]> => {
    const eventListEntries = Object.entries(deviceEventLists)
    const appendOnEventPromises = eventListEntries.map(async ([deviceId, deviceEvents]) => {
      if (deviceEvents[0].state !== DeviceState.ON) {
        const dbResponse = await this.dbFunctions.getEventsBeforeStart(
          startTimestamp,
          parseInt(deviceId, 10)
        )
        if (shouldPrependAdditionalOnEvent(dbResponse.docs)) {
          deviceEvents.unshift(dbResponse.docs[0])
        }
      }
    })
    await Promise.allSettled(appendOnEventPromises)

    const appendOffEventPromises = eventListEntries.map(async ([deviceId, deviceEvents]) => {
      if (deviceEvents[deviceEvents.length - 1].state !== DeviceState.OFF) {
        const dbResponse = await this.dbFunctions.getEventsAfterEnd(
          endTimestamp,
          parseInt(deviceId, 10)
        )
        if (shouldAppendAdditionalOffEvent(dbResponse.docs)) {
          deviceEvents.push(dbResponse.docs[0])
        }
      }
    })
    await Promise.allSettled(appendOffEventPromises)

    return Object.values(deviceEventLists)
  }
}

export default GetIrrigationEvents

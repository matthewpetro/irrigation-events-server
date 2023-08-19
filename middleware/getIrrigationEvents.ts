import { Request, Response } from 'express'
import { isValid, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { MangoQuery } from 'nano'
import { IrrigationEventDocument, DeviceState } from '../types.js'
import db from '../database.js'

type IrrigationEvent = {
  timestamp: string
  deviceName: string
  deviceId: number
  state: DeviceState
}

function convertTimestampToUTC(timestamp: string): string {
  const date = parseISO(timestamp)
  if (!isValid(date)) {
    throw new Error('Invalid timestamp')
  }
  return formatInTimeZone(date, 'Z', "yyyy-MM-dd'T'HH:mm:ss.SSSX")
}

export default async function getIrrigationEvents(req: Request, res: Response) {
  const { startTimestamp, endTimestamp } = req.query ?? {}

  if (!startTimestamp || !endTimestamp) {
    res.status(400).send('Missing startTimestamp or endTimestamp')
    return
  }

  if (typeof startTimestamp !== 'string' || typeof endTimestamp !== 'string') {
    res.status(400).send('Invalid startTimestamp or endTimestamp')
    return
  }

  let formattedStart: string = ''
  let formattedEnd: string = ''

  try {
    formattedStart = convertTimestampToUTC(startTimestamp as string)
    formattedEnd = convertTimestampToUTC(endTimestamp as string)
  } catch (error) {
    res.status(400).send('Invalid startTimestamp or endTimestamp')
  }

  const query: MangoQuery = {
    selector: {
      $and: [
        {
          _id: {
            $gt: formattedStart,
          },
        },
        {
          _id: {
            $lt: formattedEnd,
          },
        },
      ],
    },
    sort: [{_id: "asc"}],
    limit: 10000,
  }
  try {
    const dbResponse = await db.find(query)
    const irrigationEvents: IrrigationEvent[] = dbResponse.docs.map(
      ({ _id, deviceName, deviceId, state }: IrrigationEventDocument) => ({
          timestamp: _id,
          deviceName,
          deviceId,
          state,
        })
    )
    res.status(200).json(irrigationEvents)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500).send('Internal server error')
  }
}

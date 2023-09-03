import { Request, Response } from 'express'
import { isValid, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { MangoQuery } from 'nano'
import { IrrigationEventDocument } from '../types.js'
import db from '../database.js'
import viewmodelBuilder from '../viewmodels/irrigationEvent.js'

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
    const viewmodel = viewmodelBuilder(dbResponse.docs as IrrigationEventDocument[])
    res.status(200).json(viewmodel)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500).send('Internal server error')
  }
}

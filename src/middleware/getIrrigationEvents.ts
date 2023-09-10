import { Request, Response } from 'express'
import { parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { MangoQuery } from 'nano'
import { z } from 'zod'
import { IrrigationEventDocument } from '../types.js'
import db from '../database.js'
import viewmodelBuilder from '../viewmodels/irrigationEvent.js'

const timestampSchema = z
  .string({ required_error: 'Timestamp is required', invalid_type_error: 'Must be a datetime' })
  .datetime({ offset: true, message: 'Invalid datetime string' })
  .transform((timestamp) => formatInTimeZone(parseISO(timestamp), 'Z', "yyyy-MM-dd'T'HH:mm:ss.SSSX"))

const queryParamsSchema = z
  .object({ startTimestamp: timestampSchema, endTimestamp: timestampSchema })
  .required()

export default async function getIrrigationEvents(req: Request, res: Response) {
  const zodResult = queryParamsSchema.safeParse(req.query)
  if (!zodResult.success) {
    // eslint-disable-next-line no-console
    console.error(zodResult.error.issues)
    res.status(400).send(zodResult.error.issues)
    return
  }
  const { startTimestamp, endTimestamp } = zodResult.data

  const query: MangoQuery = {
    selector: {
      $and: [
        {
          _id: {
            $gt: startTimestamp,
          },
        },
        {
          _id: {
            $lt: endTimestamp,
          },
        },
      ],
    },
    sort: [{ _id: 'asc' }],
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

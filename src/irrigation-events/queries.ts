import { MangoQuery } from 'nano'

export const eventsAfterEndQueryBuilder = (endTimestamp: string, deviceId: number): MangoQuery => ({
  selector: {
    $and: [
      {
        _id: {
          $gt: endTimestamp,
        },
      },
      {
        deviceId: {
          $eq: deviceId,
        },
      },
    ],
  },
  limit: 2,
  sort: [
    {
      _id: 'asc',
    },
  ],
})

export const eventsBeforeStartQueryBuilder = (startTimestamp: string, deviceId: number): MangoQuery => ({
  selector: {
    $and: [
      {
        _id: {
          $lt: startTimestamp,
        },
      },
      {
        deviceId: {
          $eq: deviceId,
        },
      },
    ],
  },
  limit: 2,
  sort: [
    {
      _id: 'desc',
    },
  ],
})

export const irrigationEventsQueryBuilder = (startTimestamp: string, endTimestamp: string): MangoQuery => ({
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
})

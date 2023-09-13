import { MangoQuery } from 'nano'

const queryBuilder = (endTimestamp: string, deviceId: number): MangoQuery => ({
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

export default queryBuilder

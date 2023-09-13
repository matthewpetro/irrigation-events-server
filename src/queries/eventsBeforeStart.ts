import { MangoQuery } from 'nano'

const queryBuilder = (startTimestamp: string, deviceId: number): MangoQuery => ({
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

export default queryBuilder
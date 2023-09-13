import { MangoQuery } from 'nano'

const queryBuilder = (startTimestamp: string, endTimestamp: string): MangoQuery => ({
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

export default queryBuilder

import { MangoQuery } from 'nano'

export const sunriseSunsetQueryBuilder = (startDate: string, endDate: string): MangoQuery => ({
  selector: {
    $and: [
      {
        _id: {
          $gte: startDate,
        },
      },
      {
        _id: {
          $lte: endDate,
        },
      },
    ],
  },
  sort: [{ _id: 'asc' }],
  limit: 10000,
})

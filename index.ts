import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import sendEventToDb from './src/middleware/sendEventToDb.js'
import getIrrigationEvents from './src/middleware/getIrrigationEvents.js'

const PORT = 3000

const app: Express = express()
app.use(express.json())
app.use(cors())

app.get('/', (req: Request, res: Response) => {
  res.send('OK')
})

app.post('/irrigationEvent', sendEventToDb)

app.get('/irrigationEvents', getIrrigationEvents)

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`)
})

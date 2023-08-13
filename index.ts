import express, { Express, Request, Response } from 'express'
import sendEventToDb from './middleware/sendEventToDb.js'
import getIrrigationEvents from './middleware/getIrrigationEvents.js'

const PORT = 3000

const app: Express = express()
app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.send('OK')
})

app.post('/irrigationEvent', sendEventToDb)

app.get('/irrigationEvents', getIrrigationEvents)

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

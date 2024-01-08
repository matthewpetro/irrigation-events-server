import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import DbFunctions from './database.js'
import SendEventToDb from './middleware/sendEventToDb.js'
import GetIrrigationEvents from './middleware/getIrrigationEvents.js'

const app: Express = express()
app.use(express.json())
app.use(cors())

app.get('/', (req: Request, res: Response) => {
  res.send('OK')
})

const dbFunctions = DbFunctions.getInstance()

app.post('/irrigationEvent', new SendEventToDb(dbFunctions).sendEventToDb)

app.get('/irrigationEvents', new GetIrrigationEvents(dbFunctions).getIrrigationEvents)

export default app

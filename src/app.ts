import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import db from './database.js'
import SendEventToDb from './middleware/sendEventToDb.js'
import getIrrigationEvents from './middleware/getIrrigationEvents.js'

const app: Express = express()
app.use(express.json())
app.use(cors())

app.get('/', (req: Request, res: Response) => {
  res.send('OK')
})

const sendEventToDb = new SendEventToDb(db)

app.post('/irrigationEvent', (req, res) => sendEventToDb.sendEventToDb(req, res))

app.get('/irrigationEvents', getIrrigationEvents)

export default app
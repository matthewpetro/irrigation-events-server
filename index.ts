import express, { Express, Request, Response } from 'express'
// import dotenv from 'dotenv'

// dotenv.config({ path: '.env.local'})
const PORT = 3000

type MakerApiEventContent = {
  name: string
  value: string
  displayName: string
  deviceId: string
  descriptionText: string
  unit: string | null
  type: string
  data: string | null
}

type MakerApiEvent = {
  content: MakerApiEventContent
}

const DeviceState = {
  ON: 'on',
  OFF: 'off',
} as const

// eslint-disable-next-line @typescript-eslint/no-redeclare
type DeviceState = (typeof DeviceState)[keyof typeof DeviceState]

type IrrigationEvent = {
  deviceName: string
  deviceId: number
  state: DeviceState
  timestamp: number
}

const makerEventToIrrigationEvent = (event: MakerApiEvent): IrrigationEvent => {
  const { displayName, value, deviceId } = event.content
  return {
    deviceName: displayName,
    deviceId: parseInt(deviceId, 10),
    state: value === 'on' ? DeviceState.ON : DeviceState.OFF,
    timestamp: Date.now()
  }
}

const app: Express = express()
app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.send('OK')
})

app.post('/irrigationEvent', (req: Request, res: Response) => {
  const event: MakerApiEvent = req.body
  console.log(req.body)
  const irrigationEvent = makerEventToIrrigationEvent(event)
  console.log(irrigationEvent)
  res.status(200).end()
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

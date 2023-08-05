import express, { Express, Request, Response} from 'express'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local'})

const app: Express = express()
const port = process.env.PORT

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.send('OK')
})

app.post('/irrigationEvent', (req: Request, res: Response) => {
  console.log(req.body)
  res.status(200).end()
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})

import axios from 'axios'
import { DeviceState } from './types.js'

const instance = axios.create({
  baseURL: process.env.MAKER_API_URL,
  params: {
    access_token: process.env.MAKER_API_ACCESS_TOKEN,
  },
})

type MakerDeviceDetails = {
  id: string
  label: string
  attributes: { switch: DeviceState }
}

async function getAllDeviceStates() {
  const data = await instance.get<MakerDeviceDetails[]>('/all').then((response) => response.data)
  return Object.fromEntries(data.map((device) => ([device.id, device.attributes.switch])))
}

export default getAllDeviceStates

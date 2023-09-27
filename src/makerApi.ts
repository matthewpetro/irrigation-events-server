import axios from 'axios'
import { DeviceState } from './types.js'

const MAKER_API_URL = 'http://192.168.42.5/apps/api/1047/devices'
const MAKER_API_ACCESS_TOKEN = '50706516-aae8-45b1-9600-7ddb8baff3c7'

const instance = axios.create({
  baseURL: MAKER_API_URL,
  params: {
    access_token: MAKER_API_ACCESS_TOKEN,
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

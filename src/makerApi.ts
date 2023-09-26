import axios from "axios"
import { DeviceState } from "./types.js"

const MAKER_API_URL = 'http://192.168.42.5/apps/api/1047/devices'
const MAKER_API_ACCESS_TOKEN = '50706516-aae8-45b1-9600-7ddb8baff3c7'

const instance = axios.create({
  baseURL: MAKER_API_URL,
  params: {
    access_token: MAKER_API_ACCESS_TOKEN
  }
})

type MakerDeviceAttribute = {
  name: string
  currentValue: DeviceState
}

type MakerDeviceDetails = {
  id: string
  label: string
  attributes: MakerDeviceAttribute[]
}

type DeviceStates = {
  [deviceId: string]: DeviceState
}

async function getAllDeviceStates() {
  const data = await instance.get<MakerDeviceDetails[]>('/all').then(response => response.data)
  return data.reduce((accumulator, device) => {
    const state = device.attributes.find(attribute => attribute.name === 'switch')?.currentValue
    if (state) {
      accumulator[device.id] = state
    }
    return accumulator
  }, {} as DeviceStates)
}

async function getDeviceState(deviceId: string) {
  const data = await instance.get<MakerDeviceDetails>(`/${deviceId}`).then(response => response.data)
  return data.attributes.find(attribute => attribute.name === 'switch')?.currentValue
}

export { getAllDeviceStates, getDeviceState }
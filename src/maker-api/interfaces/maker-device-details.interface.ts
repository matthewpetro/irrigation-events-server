import { DeviceState } from '@/enums/device-state.interface'

export interface MakerDeviceDetails {
  id: string
  label: string
  attributes: {
    switch: DeviceState
  }
}

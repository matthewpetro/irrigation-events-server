import EnvironmentVariables from '@/environment-variables'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
import { DeviceState } from '@/enums/device-state.interface'
import { DeviceStates } from './interfaces/device-states.interface'

interface MakerDeviceDetails {
  id: string
  attributes: {
    switch: DeviceState
  }
}

// TODO: add error handling in this service

@Injectable()
export class MakerApiService implements OnModuleInit {
  private axiosInstance: AxiosInstance
  public constructor(private configService: ConfigService<EnvironmentVariables, true>) {}

  onModuleInit() {
    this.axiosInstance = axios.create({
      baseURL: this.configService.get<string>('MAKER_API_URL', { infer: true }),
      params: {
        access_token: this.configService.get<string>('MAKER_API_ACCESS_TOKEN', { infer: true }),
      },
    })
  }

  public async getAllDeviceStates() {
    const response = await this.axiosInstance.get<MakerDeviceDetails[]>('/all')
    const data = response.data ?? []
    return Object.fromEntries(data.map((device) => [parseInt(device.id, 10), device.attributes.switch])) as DeviceStates
  }

  public async setDeviceState(deviceId: number, state: DeviceState) {
    await this.axiosInstance.get(`/${deviceId}/${state}`)
  }

  public async getDeviceState(deviceId: number) {
    const response = await this.axiosInstance.get<{ value: string }>(`/${deviceId}/attribute/switch`)
    return response.data.value as DeviceState
  }
}

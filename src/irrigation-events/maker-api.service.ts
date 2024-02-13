import EnvironmentVariables from '@/environment-variables'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosRequestConfig } from 'axios'
import { MakerDeviceDetails } from './interfaces/maker-device-details.interface'
import { DeviceStates } from './interfaces/device-states.interface'

@Injectable()
export class MakerApiService implements OnModuleInit {
  private axiosConfig: AxiosRequestConfig
  public constructor(private configService: ConfigService<EnvironmentVariables, true>) {}

  onModuleInit() {
    this.axiosConfig = {
      baseURL: this.configService.get<string>('MAKER_API_URL', { infer: true }),
      params: {
        access_token: this.configService.get<string>('MAKER_API_ACCESS_TOKEN', { infer: true }),
      },
    }
  }

  public async getAllDeviceDetails() {
    const response = await axios.get<MakerDeviceDetails[]>('/all', this.axiosConfig)
    const data = response?.data ?? []
    return Object.fromEntries(data.map((device) => [parseInt(device.id, 10), device.attributes.switch])) as DeviceStates
  }
}

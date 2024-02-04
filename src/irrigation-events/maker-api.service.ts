import EnvironmentVariables from '@/environment-variables'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
import { MakerDeviceDetails } from './interfaces/maker-device-details.interface'
import { DeviceStates } from './interfaces/device-states.interface'

@Injectable()
export class MakerApiService {
  private axiosInstance: AxiosInstance
  public constructor(private configService: ConfigService<EnvironmentVariables, true>) {
    this.axiosInstance = axios.create({
      baseURL: this.configService.get<string>('MAKER_API_URL', { infer: true }),
      params: {
        access_token: this.configService.get<string>('MAKER_API_ACCESS_TOKEN', { infer: true }),
      },
    })
  }
  public async getAllDeviceStates() {
    const data = await this.axiosInstance.get<MakerDeviceDetails[]>('/all').then((response) => response.data)
    return Object.fromEntries(data.map((device) => [device.id, device.attributes.switch])) as DeviceStates
  }
}

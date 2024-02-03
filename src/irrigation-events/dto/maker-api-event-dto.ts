import { DeviceState } from '../interfaces/device-state.interface'
import { Equals, IsNumber, IsString, IsEnum } from 'class-validator'

export class MakerApiEventDto {
  @Equals('switch')
  name: string

  @IsString()
  displayName: string

  @IsNumber()
  deviceId: number

  @IsEnum(DeviceState)
  value: DeviceState
}

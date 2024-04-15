import { Equals, IsNumber, IsString, IsEnum } from 'class-validator'
import { DeviceState } from '@/enums/device-state.enum'

export class MakerApiEventDto {
  @Equals('switch')
  readonly name: string

  @IsString()
  readonly displayName: string

  @IsNumber()
  readonly deviceId: number

  @IsEnum(DeviceState)
  readonly value: DeviceState
}

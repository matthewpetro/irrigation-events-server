import { Equals, IsNumber, IsString, IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { DeviceState } from '@/enums/device-state.enum'

export class MakerApiEventDto {
  @ApiProperty()
  @Equals('switch')
  readonly name!: string

  @ApiProperty()
  @IsString()
  readonly displayName!: string

  @ApiProperty()
  @IsNumber()
  readonly deviceId!: number

  @ApiProperty({ enum: DeviceState })
  @IsEnum(DeviceState)
  readonly value!: DeviceState
}

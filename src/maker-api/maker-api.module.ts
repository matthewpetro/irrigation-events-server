import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MakerApiService } from './maker-api.service'

@Module({
  imports: [ConfigModule],
  providers: [MakerApiService],
  exports: [MakerApiService],
})
export class MakerApiModule {}

import { Module } from '@nestjs/common'
import { MakerApiService } from './maker-api.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule],
  providers: [MakerApiService],
  exports: [MakerApiService],
})
export class MakerApiModule {}

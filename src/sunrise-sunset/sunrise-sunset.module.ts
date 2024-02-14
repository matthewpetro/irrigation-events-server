import { Module } from '@nestjs/common'
import { SunriseSunsetService } from './sunrise-sunset.service'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '@/database/database.module'

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [SunriseSunsetService],
  exports: [SunriseSunsetService],
})
export class SunriseSunsetModule {}

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '@/database/database.module'
import { SunriseSunsetService } from './sunrise-sunset.service'
import { SunriseSunsetController } from './sunrise-sunset.controller'

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [SunriseSunsetService],
  exports: [SunriseSunsetService],
  controllers: [SunriseSunsetController],
})
export class SunriseSunsetModule {}

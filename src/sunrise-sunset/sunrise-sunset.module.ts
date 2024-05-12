import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SunriseSunsetService } from './sunrise-sunset.service'
import { DatabaseModule } from '@/database/database.module'
import { SunriseSunsetController } from './sunrise-sunset.controller'

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [SunriseSunsetService],
  exports: [SunriseSunsetService],
  controllers: [SunriseSunsetController],
})
export class SunriseSunsetModule {}

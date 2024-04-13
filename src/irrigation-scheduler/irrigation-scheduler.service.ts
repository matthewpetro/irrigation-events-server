import { IrrigationProgramsService } from '@/irrigation-programs/irrigation-programs.service'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { SunriseSunset } from '@/sunrise-sunset/interfaces/sunrise-sunset.interface'
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SunriseSunsetService } from '@/sunrise-sunset/sunrise-sunset.service'
import { IrrigationProgram } from './irrigation-program'
import { DeviceInterval } from '@/irrigation-programs/interfaces/device-interval.interface'
import { addDays, addMinutes, format, interval, isThisMinute, set, startOfMinute } from 'date-fns'
import type { UpdateIrrigationProgram } from '@/irrigation-programs/types'
import { DeviceState } from '@/enums/device-state.enum'
import { ConfigService } from '@nestjs/config'
import EnvironmentVariables from '@/environment-variables'

function calculateDeviceIntervals(irrigationProgram: IrrigationProgram): DeviceInterval[] {
  const { deviceIds, simultaneousIrrigation, duration } = irrigationProgram
  return irrigationProgram.getActualStartTimes().flatMap((actualStartTime) => {
    if (simultaneousIrrigation) {
      const irrigationInterval = interval(actualStartTime, addMinutes(actualStartTime, duration))
      return deviceIds.map((deviceId) => ({ deviceId, interval: irrigationInterval }) as DeviceInterval)
    } else {
      return deviceIds.map((deviceId, deviceIndex) => {
        const irrigationInterval = interval(
          addMinutes(actualStartTime, duration * deviceIndex),
          addMinutes(actualStartTime, duration * deviceIndex + duration)
        )
        return { deviceId, interval: irrigationInterval } as DeviceInterval
      })
    }
  })
}

function calculateNextRunDate({ wateringPeriod }: IrrigationProgram) {
  return format(addDays(Date.now(), wateringPeriod), 'yyyy-MM-dd')
}

function createDateFromTimeString(timeString: string) {
  const [hours, minutes] = timeString.split(':')
  return startOfMinute(set(Date.now(), { hours: parseInt(hours), minutes: parseInt(minutes) }))
}

@Injectable()
export class IrrigationSchedulerService {
  private readonly logger = new Logger(IrrigationSchedulerService.name)
  private readonly defaultSunriseSunset: SunriseSunset
  public constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
    private irrigationProgramsService: IrrigationProgramsService,
    private makerApiService: MakerApiService,
    private sunriseSunsetService: SunriseSunsetService
  ) {
    const defaultSunrise = this.configService.get<string>('DEFAULT_SUNRISE_TIME', '06:30', { infer: true })
    const defaultSunset = this.configService.get<string>('DEFAULT_SUNSET_TIME', '18:30', { infer: true })
    this.defaultSunriseSunset = {
      sunrise: createDateFromTimeString(defaultSunrise),
      sunset: createDateFromTimeString(defaultSunset),
    }
  }

  // When the start time of a program is reached, calculate the intervals for each device for the
  // whole program.
  // Save the intervals to the database and also update the next run date in the database.
  // This means that once a program starts running, no more changes can be made to the current run.
  // When all intervals are completed, delete all intervals from the database.
  // When checking programs to see if they should run, look for intervals. If they
  // are stored in the database, that means the program is running. If there are no intervals,
  // then we need to see if the program should start now and calculate the intervals.
  @Cron(CronExpression.EVERY_MINUTE, { name: 'irrigation-scheduler', disabled: process.env.NODE_ENV === 'test' })
  async run() {
    this.logger.log('Running irrigation scheduler')
    let irrigationPrograms: IrrigationProgram[]
    const sunriseSunset = await this.sunriseSunsetService.getSunriseSunset(new Date())
    try {
      const programs = await this.irrigationProgramsService.findAll()
      irrigationPrograms = programs.map(
        (program) => new IrrigationProgram(program, sunriseSunset ?? this.defaultSunriseSunset)
      )
    } catch (error) {
      this.logger.error('Error getting irrigation programs:', error)
      return
    }
    const currentlyRunningPrograms = irrigationPrograms.filter((program) => program.isProgramRunning())
    // Get all programs that should start now and calculate the intervals for each device
    const programsToStart = irrigationPrograms.filter(
      (program) => !program.isProgramRunning() && program.shouldProgramRunToday() && program.isProgramStartTime()
    )
    for (const program of programsToStart) {
      const deviceIntervals = calculateDeviceIntervals(program)
      const nextRunDate = calculateNextRunDate(program)
      try {
        await this.irrigationProgramsService.update(program.id, {
          deviceIntervals,
          nextRunDate,
        } as UpdateIrrigationProgram)
        program.deviceIntervals = deviceIntervals
        currentlyRunningPrograms.push(program)
      } catch (error) {
        this.logger.error(
          `Error setting device intervals and next run date for irrigation program with name ${program.name} and ID ${program.id}:`,
          error
        )
      }
    }

    // Check all intervals and turn devices on or off as needed
    const meteringInterval = this.configService.get<number>('SWITCH_METERING_INTERVAL', 500, { infer: true })
    for (const program of currentlyRunningPrograms) {
      for (const deviceInterval of program.deviceIntervals!) {
        const { deviceId, interval } = deviceInterval
        if (isThisMinute(interval.start)) {
          try {
            await this.makerApiService.setDeviceState(deviceId, DeviceState.ON)
            await new Promise((resolve) => setTimeout(resolve, meteringInterval))
          } catch (error) {
            this.logger.error(`Error turning on device with ID ${deviceId}:`, error)
          }
        }
        if (isThisMinute(interval.end)) {
          try {
            await this.makerApiService.setDeviceState(deviceId, DeviceState.OFF)
            await new Promise((resolve) => setTimeout(resolve, meteringInterval))
          } catch (error) {
            this.logger.error(`Error turning off device with ID ${deviceId}:`, error)
          }
        }
      }
    }

    // Check if any programs have completed and remove the intervals from the database
    for (const program of currentlyRunningPrograms) {
      if (program.areAllIntervalsCompleted()) {
        try {
          await this.irrigationProgramsService.update(program.id, {
            deviceIntervals: null,
          } as UpdateIrrigationProgram)
        } catch (error) {
          this.logger.error(
            `Error removing device intervals for irrigation program with name ${program.name} and ID ${program.id}:`,
            error
          )
        }
      }
    }
  }
}

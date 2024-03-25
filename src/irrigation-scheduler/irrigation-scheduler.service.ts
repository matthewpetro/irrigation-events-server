import { IrrigationProgramsService } from '@/irrigation-programs/irrigation-programs.service'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { SunriseSunset } from '@/sunrise-sunset/interfaces/sunrise-sunset.interface'
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SunriseSunsetService } from '@/sunrise-sunset/sunrise-sunset.service'
import { IrrigationProgram } from './irrigation-program'
import { DeviceInterval } from '@/irrigation-programs/interfaces/device-interval.interface'
import { addDays, addMinutes, format, interval, isPast, isThisMinute } from 'date-fns'
import type { UpdateIrrigationProgram } from '@/irrigation-programs/types'
import { DeviceState } from '@/enums/device-state.interface'
import { ConfigService } from '@nestjs/config'
import EnvironmentVariables from '@/environment-variables'

function calculateDeviceIntervals(irrigationProgram: IrrigationProgram): DeviceInterval[] {
  const { deviceIds, simultaneousIrrigation, duration } = irrigationProgram
  const actualStartTime = irrigationProgram.getActualStartTime()
  let deviceIntervals: DeviceInterval[]

  if (simultaneousIrrigation) {
    const irrigationInterval = interval(actualStartTime, addMinutes(actualStartTime, duration))
    deviceIntervals = deviceIds.map((deviceId) => ({ deviceId, interval: irrigationInterval }))
  } else {
    deviceIntervals = deviceIds.map((deviceId, deviceIndex) => {
      const irrigationInterval = interval(
        addMinutes(actualStartTime, duration * deviceIndex),
        addMinutes(actualStartTime, duration * deviceIndex + duration)
      )
      return { deviceId, interval: irrigationInterval }
    })
  }
  return deviceIntervals
}

function calculateNextRunDate({ wateringPeriod }: IrrigationProgram) {
  return format(addDays(Date.now(), wateringPeriod), 'yyyy-MM-dd')
}

@Injectable()
export class IrrigationSchedulerService {
  private readonly logger = new Logger(IrrigationSchedulerService.name)
  public constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
    private irrigationProgramsService: IrrigationProgramsService,
    private makerApiService: MakerApiService,
    private sunriseSunsetService: SunriseSunsetService
  ) {}

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
    let sunriseSunset: SunriseSunset
    let irrigationPrograms: IrrigationProgram[]
    try {
      sunriseSunset = await this.sunriseSunsetService.getSunriseSunset(new Date())
    } catch (error) {
      this.logger.error('Error getting sunrise and sunset for today:', error)
      return
    }
    try {
      const programs = await this.irrigationProgramsService.findAll()
      irrigationPrograms = programs.map((program) => new IrrigationProgram(program, sunriseSunset))
    } catch (error) {
      this.logger.error('Error getting irrigation programs:', error)
      return
    }
    const currentlyRunningPrograms = irrigationPrograms.filter((program) => program.isProgramRunning)

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
    const meteringInterval = this.configService.get<number>('SWITCH_METERING_INTERVAL', { infer: true }) ?? 500
    for (const program of currentlyRunningPrograms) {
      for (const deviceInterval of program.deviceIntervals!) {
        const { deviceId, interval } = deviceInterval
        if (isThisMinute(interval.start)) {
          try {
            await this.makerApiService.setDeviceState(deviceId, DeviceState.ON)
            await new Promise((resolve) => setTimeout(resolve, meteringInterval))
          } catch (error) {
            this.logger.error(`Error turning device with ID ${deviceId} on:`, error)
          }
        }
        if (isThisMinute(interval.end)) {
          try {
            await this.makerApiService.setDeviceState(deviceId, DeviceState.OFF)
            await new Promise((resolve) => setTimeout(resolve, meteringInterval))
          } catch (error) {
            this.logger.error(`Error turning device with ID ${deviceId} off:`, error)
          }
        }
      }
    }

    // Check if any programs have completed and remove the intervals from the database
    for (const program of currentlyRunningPrograms) {
      const deviceIntervals = program.deviceIntervals!
      const areAllIntervalsCompleted = deviceIntervals.every((deviceInterval) => isPast(deviceInterval.interval.end))
      if (areAllIntervalsCompleted) {
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

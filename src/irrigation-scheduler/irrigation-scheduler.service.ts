import { IrrigationProgramsService } from '@/irrigation-programs/irrigation-programs.service'
import { MakerApiService } from '@/maker-api/maker-api.service'
import { SunriseSunset } from '@/sunrise-sunset/interfaces/sunrise-sunset.interface'
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SunriseSunsetService } from '@/sunrise-sunset/sunrise-sunset.service'
import { IrrigationProgram } from '@/irrigation-programs/interfaces/irrigation-program.interface'
import { DeviceInterval } from '@/irrigation-programs/interfaces/device-interval.interface'
import {
  addDays,
  addMinutes,
  format,
  interval,
  isBefore,
  isPast,
  isThisMinute,
  isToday,
  parseISO,
  set,
  startOfMinute,
  startOfToday,
} from 'date-fns'
import type { UpdateIrrigationProgram } from '@/irrigation-programs/types'
import { DeviceState } from '@/enums/device-state.interface'
import { ConfigService } from '@nestjs/config'
import EnvironmentVariables from '@/environment-variables'

function convertStartTimeToActualTime(startTime: string, sunriseSunset: SunriseSunset) {
  const sunriseSunsetRegex = /^(?<sunriseOrSunset>sunset|sunrise)(?<offset>[+-]?\d+)?$/
  const matches = startTime.match(sunriseSunsetRegex)
  let actualStartTime: Date
  if (matches) {
    // If the start time is a sunrise or sunset, then we need to determine the actual time
    // based on the sunrise or sunset and offset.
    const { sunriseOrSunset, offset } = matches.groups!
    const realTimeOfDay = sunriseSunset[sunriseOrSunset] as Date
    actualStartTime = addMinutes(realTimeOfDay, parseInt(offset))
  } else {
    // Otherwise, we just need to turn the start time into a Date object
    const [hours, minutes] = startTime.split(':')
    actualStartTime = set(Date.now(), { hours: parseInt(hours), minutes: parseInt(minutes) })
  }
  return startOfMinute(actualStartTime)
}

function calculateDeviceIntervals(irrigationProgram: IrrigationProgram, actualStartTime: Date): DeviceInterval[] {
  const { deviceIds, simultaneousIrrigation, duration } = irrigationProgram
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

const calculateNextRunDate = ({ wateringPeriod }: IrrigationProgram) =>
  format(addDays(Date.now(), wateringPeriod), 'yyyy-MM-dd')

// A program should run today if it has no next run date, or if the next run date is today or in the past.
// Next run dates in the past shouldn't happen, but in case of a bug or weird edge case, this will handle it.
const shouldProgramRunToday = ({ nextRunDate }: IrrigationProgram) =>
  !nextRunDate || isToday(parseISO(nextRunDate)) || isBefore(parseISO(nextRunDate), startOfToday())

const isProgramStartTime = (program: IrrigationProgram, sunriseSunset: SunriseSunset) =>
  !isProgramRunning(program) && isThisMinute(convertStartTimeToActualTime(program.startTime, sunriseSunset))

const isProgramRunning = ({ deviceIntervals }: IrrigationProgram) => !!deviceIntervals

@Injectable()
export class IrrigationSchedulerService {
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
    let sunriseSunset: SunriseSunset
    let irrigationPrograms: IrrigationProgram[]
    try {
      sunriseSunset = await this.sunriseSunsetService.getSunriseSunset(new Date())
    } catch (error) {
      console.error('Error getting sunrise and sunset for today:', error)
      return
    }
    try {
      irrigationPrograms = await this.irrigationProgramsService.findAll()
    } catch (error) {
      console.error('Error getting irrigation programs:', error)
      return
    }
    const currentlyRunningPrograms = irrigationPrograms.filter(isProgramRunning)
    const currentlyRunningDeviceIntervals = currentlyRunningPrograms.flatMap((program) => program.deviceIntervals!)

    // Get all programs that should start now and calculate the intervals for each device
    const programsToStart = irrigationPrograms.filter(
      (program) => shouldProgramRunToday(program) && isProgramStartTime(program, sunriseSunset)
    )
    for (const program of programsToStart) {
      const actualStartTime = convertStartTimeToActualTime(program.startTime, sunriseSunset)
      const deviceIntervals = calculateDeviceIntervals(program, actualStartTime)
      const nextRunDate = calculateNextRunDate(program)
      try {
        const updatedProgram = await this.irrigationProgramsService.update(program.id, {
          deviceIntervals,
          nextRunDate,
        } as UpdateIrrigationProgram)
        currentlyRunningDeviceIntervals.push(...deviceIntervals)
        currentlyRunningPrograms.push(updatedProgram)
      } catch (error) {
        console.error(
          `Error setting device intervals and next run date for irrigation program with name ${program.name} and ID ${program.id}:`,
          error
        )
      }
    }

    // Check all intervals and turn devices on or off as needed
    const meteringInterval = this.configService.get<number>('SWITCH_METERING_INTERVAL', { infer: true }) ?? 500
    for (const deviceInterval of currentlyRunningDeviceIntervals) {
      const { deviceId, interval } = deviceInterval
      if (isThisMinute(interval.start)) {
        try {
          await this.makerApiService.setDeviceState(deviceId, DeviceState.ON)
          await new Promise((resolve) => setTimeout(resolve, meteringInterval))
        } catch (error) {
          console.error(`Error turning device with ID ${deviceId} on:`, error)
        }
      }
      if (isThisMinute(interval.end)) {
        try {
          await this.makerApiService.setDeviceState(deviceId, DeviceState.OFF)
          await new Promise((resolve) => setTimeout(resolve, meteringInterval))
        } catch (error) {
          console.error(`Error turning device with ID ${deviceId} off:`, error)
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
          console.error(
            `Error removing device intervals for irrigation program with name ${program.name} and ID ${program.id}:`,
            error
          )
        }
      }
    }
  }
}

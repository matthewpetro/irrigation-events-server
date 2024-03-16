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
  isThisMinute,
  isToday,
  parseISO,
  set,
  startOfMinute,
  startOfToday,
} from 'date-fns'
import type { UpdateIrrigationProgram } from '@/irrigation-programs/types'
import { DeviceState } from '@/enums/device-state.interface'

// When the first start time of a program is reached, calculate the intervals for each device for the
// whole program.
// Save the intervals to the database and also update the next run date in the database.
// Once a program starts running, no more changes can be made to the current run.
// When the last interval is completed, delete all intervals from the database.
// When checking programs to see if they should run, look for intervals. If they
// are stored in the database, we don't need to consider start times, start dates,
// or anything else.
// This can handle multiple devices, multiple start times, and intervals that span midnight.

function convertStartTimeToActualTime(startTime: string, sunriseSunset: SunriseSunset) {
  const sunriseSunsetRegex = /^(?<sunriseOrSunset>sunset|sunrise)(?<offset>[+-]?\d+)?$/
  const matches = startTime.match(sunriseSunsetRegex)
  if (matches) {
    // If the start time is a sunrise or sunset, then we need to determine the actual time
    // based on the sunrise or sunset and offset.
    const { sunriseOrSunset, offset } = matches.groups!
    const realTimeOfDay = sunriseSunset[sunriseOrSunset] as Date
    const actualStartTime = addMinutes(realTimeOfDay, parseInt(offset))
    return startOfMinute(actualStartTime)
  } else {
    // Otherwise, we just need to turn the start time into a Date object
    const [hours, minutes] = startTime.split(':')
    return set(Date.now(), { hours: parseInt(hours), minutes: parseInt(minutes), seconds: 0, milliseconds: 0 })
  }
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

function calculateNextRunDate(irrigationProgram: IrrigationProgram): string {
  const { wateringPeriod } = irrigationProgram
  return format(addDays(Date.now(), wateringPeriod), 'yyyy-MM-dd')
}

// A program should run today if it has no next run date, or if the next run date is today or in the past.
// Next run dates in the past shouldn't happen, but in case of a bug or weird edge case, this will handle it.
function shouldProgramRunToday({ nextRunDate }: IrrigationProgram) {
  return !nextRunDate || isToday(parseISO(nextRunDate)) || isBefore(parseISO(nextRunDate), startOfToday())
}

function isProgramStartTime(program: IrrigationProgram, sunriseSunset: SunriseSunset) {
  return !isProgramRunning(program) && isThisMinute(convertStartTimeToActualTime(program.startTime, sunriseSunset))
}

function isProgramRunning({ deviceIntervals }: IrrigationProgram) {
  return !!deviceIntervals
}

@Injectable()
export class IrrigationSchedulerService {
  public constructor(
    private irrigationProgramsService: IrrigationProgramsService,
    private makerApiService: MakerApiService,
    private sunriseSunsetService: SunriseSunsetService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run() {
    const sunriseSunset = await this.sunriseSunsetService.getSunriseSunset(new Date())
    const irrigationPrograms = await this.irrigationProgramsService.findAll()
    // Get all the intervals for currently running programs
    const currentlyRunningDeviceIntervals = irrigationPrograms
      .filter(isProgramRunning)
      .flatMap((program) => program.deviceIntervals!)
    const programsToStart = irrigationPrograms.filter(
      (program) => shouldProgramRunToday(program) && isProgramStartTime(program, sunriseSunset)
    )
    for (const program of programsToStart) {
      const actualStartTime = convertStartTimeToActualTime(program.startTime, sunriseSunset)
      const deviceIntervals = calculateDeviceIntervals(program, actualStartTime)
      const nextRunDate = calculateNextRunDate(program)
      await this.irrigationProgramsService.update(program.id, {
        deviceIntervals,
        nextRunDate,
      } as UpdateIrrigationProgram)
      currentlyRunningDeviceIntervals.push(...deviceIntervals)
    }
    for (const deviceInterval of currentlyRunningDeviceIntervals) {
      const { deviceId, interval } = deviceInterval
      if (isThisMinute(interval.start)) {
        await this.makerApiService.setDeviceState(deviceId, DeviceState.ON)
      }
      if (isThisMinute(interval.end)) {
        await this.makerApiService.setDeviceState(deviceId, DeviceState.OFF)
      }
    }
  }
}

import { DeviceId } from '@/types'

export class IrrigationProgramEntity {
  constructor(
    public readonly name: string,
    public readonly duration: number,
    public readonly wateringPeriod: number,
    public readonly startTime: string,
    public readonly deviceIds: DeviceId[],
    public readonly simultaneousIrrigation: boolean,
    public readonly nextRunDate?: string
  ) {}
}

export class IrrigationProgramEntity {
  constructor(
    public readonly name: string,
    public readonly duration: number,
    public readonly wateringPeriod: number,
    public readonly startTime: string,
    public readonly deviceIds: number[],
    public readonly simultaneousIrrigation: boolean,
    public readonly nextRunDate?: string
  ) {}
}

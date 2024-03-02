export class IrrigationProgramEntity {
  constructor(
    public readonly duration: number,
    public readonly wateringPeriod: number,
    public readonly startTime: string,
    public readonly switches: number[],
    public readonly simultaneousIrrigation: boolean,
    public readonly nextRunDate?: string
  ) {}
}

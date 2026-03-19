export class ApplyBankCommand {
  constructor(
    public readonly shipId: string,
    public readonly year: number,
    public readonly amount: number,
  ) {}
}

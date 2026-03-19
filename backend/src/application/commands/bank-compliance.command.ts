export class BankComplianceCommand {
  constructor(
    public readonly shipId: string,
    public readonly year: number,
    public readonly amount: number,
  ) {}
}

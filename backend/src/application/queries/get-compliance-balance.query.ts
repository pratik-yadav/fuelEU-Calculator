export class GetComplianceBalanceQuery {
  constructor(
    public readonly shipId: string,
    public readonly year: number,
  ) {}
}

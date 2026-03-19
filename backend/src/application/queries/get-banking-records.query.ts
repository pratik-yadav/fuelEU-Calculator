export class GetBankingRecordsQuery {
  constructor(
    public readonly shipId: string,
    public readonly year: number,
  ) {}
}

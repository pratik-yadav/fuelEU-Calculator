export interface BankEntryProps {
  id: string;
  shipId: string;
  year: number;
  /** Positive = surplus banked. Negative = banked surplus applied to offset a deficit. */
  amountGco2eq: number;
  createdAt: Date;
}

/**
 * BankEntry — one entry in the banking ledger (Article 20).
 *
 * The running net-banked balance = Σ(amountGco2eq across all entries for a ship/year).
 */
export class BankEntry {
  constructor(private readonly props: BankEntryProps) {
    if (!props.shipId.trim()) throw new Error('Ship ID is required.');
    if (props.amountGco2eq === 0) throw new Error('Bank entry amount cannot be zero.');
  }

  get id(): string { return this.props.id; }
  get shipId(): string { return this.props.shipId; }
  get year(): number { return this.props.year; }
  get amountGco2eq(): number { return this.props.amountGco2eq; }
  get createdAt(): Date { return this.props.createdAt; }

  get isBanked(): boolean { return this.props.amountGco2eq > 0; }
  get isApplied(): boolean { return this.props.amountGco2eq < 0; }
}

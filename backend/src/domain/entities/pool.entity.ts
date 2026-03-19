export interface PoolMemberProps {
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface PoolProps {
  id: string;
  year: number;
  createdAt: Date;
  members: PoolMemberProps[];
}

/**
 * Pool — an Article 21 pooling event.
 * Contains the before/after CB snapshot for each participating ship.
 */
export class Pool {
  constructor(private readonly props: PoolProps) {
    if (props.members.length < 2) throw new Error('A pool requires at least 2 members.');
    if (props.year < 2020) throw new Error('Pool year must be 2020 or later.');
  }

  get id(): string { return this.props.id; }
  get year(): number { return this.props.year; }
  get createdAt(): Date { return this.props.createdAt; }
  get members(): PoolMemberProps[] { return [...this.props.members]; }
}

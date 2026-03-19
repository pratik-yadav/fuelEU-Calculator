export interface ShipComplianceProps {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number;
}

/**
 * ShipCompliance — computed Compliance Balance per ship per year.
 *
 * CB > 0 → surplus (can be banked or contributed to a pool).
 * CB < 0 → deficit (incurs FuelEU financial penalty unless offset).
 */
export class ShipCompliance {
  constructor(private readonly props: ShipComplianceProps) {
    if (!props.shipId.trim()) throw new Error('Ship ID is required.');
    if (props.year < 2020) throw new Error('Year must be 2020 or later.');
  }

  get id(): string { return this.props.id; }
  get shipId(): string { return this.props.shipId; }
  get year(): number { return this.props.year; }
  get cbGco2eq(): number { return this.props.cbGco2eq; }

  get hasSurplus(): boolean { return this.props.cbGco2eq > 0; }
  get hasDeficit(): boolean { return this.props.cbGco2eq < 0; }
}

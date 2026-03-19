import type { VesselType, VesselStatus } from '../../types';

export interface VesselProps {
  id: string;
  imoNumber: string;
  name: string;
  flag: string;
  vesselType: VesselType;
  grossTonnage: number;
  status: VesselStatus;
  yearBuilt: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vessel — Aggregate Root
 *
 * Encapsulates all business rules for a maritime vessel.
 * IMO numbers uniquely identify vessels internationally (format: IMO + 7 digits).
 */
export class Vessel {
  private readonly _id: string;
  private readonly _imoNumber: string;
  private _name: string;
  private _flag: string;
  private _vesselType: VesselType;
  private _grossTonnage: number;
  private _status: VesselStatus;
  private readonly _yearBuilt: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: VesselProps) {
    Vessel.validate(props);
    this._id = props.id;
    this._imoNumber = props.imoNumber;
    this._name = props.name;
    this._flag = props.flag;
    this._vesselType = props.vesselType;
    this._grossTonnage = props.grossTonnage;
    this._status = props.status;
    this._yearBuilt = props.yearBuilt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get id(): string { return this._id; }
  get imoNumber(): string { return this._imoNumber; }
  get name(): string { return this._name; }
  get flag(): string { return this._flag; }
  get vesselType(): VesselType { return this._vesselType; }
  get grossTonnage(): number { return this._grossTonnage; }
  get status(): VesselStatus { return this._status; }
  get yearBuilt(): number { return this._yearBuilt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // ── Domain Methods ─────────────────────────────────────────────────────────

  updateDetails(name: string, flag: string, grossTonnage: number): void {
    if (!name.trim()) throw new Error('Vessel name is required.');
    if (grossTonnage <= 0) throw new Error('Gross tonnage must be a positive number.');
    this._name = name.trim();
    this._flag = flag;
    this._grossTonnage = grossTonnage;
    this._updatedAt = new Date();
  }

  changeVesselType(vesselType: VesselType): void {
    if (this._status === 'DECOMMISSIONED') {
      throw new Error('Cannot change the type of a decommissioned vessel.');
    }
    this._vesselType = vesselType;
    this._updatedAt = new Date();
  }

  activate(): void {
    if (this._status === 'DECOMMISSIONED') {
      throw new Error('Cannot reactivate a decommissioned vessel.');
    }
    this._status = 'ACTIVE';
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._status = 'INACTIVE';
    this._updatedAt = new Date();
  }

  sendForMaintenance(): void {
    if (this._status === 'DECOMMISSIONED') {
      throw new Error('Cannot send a decommissioned vessel for maintenance.');
    }
    this._status = 'UNDER_MAINTENANCE';
    this._updatedAt = new Date();
  }

  decommission(): void {
    this._status = 'DECOMMISSIONED';
    this._updatedAt = new Date();
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  private static validate(props: VesselProps): void {
    if (!/^IMO\d{7}$/.test(props.imoNumber)) {
      throw new Error('Invalid IMO number. Format: "IMO" followed by exactly 7 digits (e.g. IMO1234567).');
    }
    if (!props.name.trim()) {
      throw new Error('Vessel name is required.');
    }
    if (props.grossTonnage <= 0) {
      throw new Error('Gross tonnage must be a positive number.');
    }
    const currentYear = new Date().getFullYear();
    if (props.yearBuilt < 1800 || props.yearBuilt > currentYear) {
      throw new Error(`Year built must be between 1800 and ${currentYear}.`);
    }
  }
}

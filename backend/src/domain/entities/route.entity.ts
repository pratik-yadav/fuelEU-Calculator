import type { FuelType, VesselType } from '../../types';

export interface RouteProps {
  id: string;
  routeId: string;
  vesselType: VesselType;
  fuelType: FuelType;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
}

/**
 * Route — Aggregate Root.
 *
 * Represents a ship's voyage profile. `routeId` doubles as the ship identifier
 * across the compliance, banking, and pooling modules.
 *
 * Only one route may be the baseline at any time (enforced at the repository layer).
 */
export class Route {
  private readonly _id: string;
  private readonly _routeId: string;
  private readonly _vesselType: VesselType;
  private readonly _fuelType: FuelType;
  private readonly _year: number;
  private readonly _ghgIntensity: number;
  private readonly _fuelConsumption: number;
  private readonly _distance: number;
  private readonly _totalEmissions: number;
  private _isBaseline: boolean;

  constructor(props: RouteProps) {
    Route.validate(props);
    this._id = props.id;
    this._routeId = props.routeId;
    this._vesselType = props.vesselType;
    this._fuelType = props.fuelType;
    this._year = props.year;
    this._ghgIntensity = props.ghgIntensity;
    this._fuelConsumption = props.fuelConsumption;
    this._distance = props.distance;
    this._totalEmissions = props.totalEmissions;
    this._isBaseline = props.isBaseline;
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get id(): string { return this._id; }
  get routeId(): string { return this._routeId; }
  get vesselType(): VesselType { return this._vesselType; }
  get fuelType(): FuelType { return this._fuelType; }
  get year(): number { return this._year; }
  get ghgIntensity(): number { return this._ghgIntensity; }
  get fuelConsumption(): number { return this._fuelConsumption; }
  get distance(): number { return this._distance; }
  get totalEmissions(): number { return this._totalEmissions; }
  get isBaseline(): boolean { return this._isBaseline; }

  // ── Domain Methods ─────────────────────────────────────────────────────────

  /** Designate this route as the compliance baseline. */
  setAsBaseline(): void {
    this._isBaseline = true;
  }

  /** Remove baseline designation (called on all other routes when a new baseline is set). */
  clearBaseline(): void {
    this._isBaseline = false;
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  private static validate(props: RouteProps): void {
    if (!props.routeId.trim()) throw new Error('Route ID is required.');
    if (props.ghgIntensity < 0) throw new Error('GHG intensity cannot be negative.');
    if (props.fuelConsumption <= 0) throw new Error('Fuel consumption must be positive.');
    if (props.distance < 0) throw new Error('Distance cannot be negative.');
    if (props.year < 2020 || props.year > 2100) throw new Error('Year out of valid range.');
  }
}

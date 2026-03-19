import type { Route } from '../entities/route.entity';

export interface RouteFilters {
  vesselType?: string;
  fuelType?: string;
  year?: number;
}

/**
 * IRouteRepository — port for the Route aggregate.
 * Implemented by PrismaRouteRepository in the infra layer.
 */
export interface IRouteRepository {
  findAll(filters?: RouteFilters): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  findByRouteId(routeId: string): Promise<Route | null>;
  findBaseline(): Promise<Route | null>;
  /** Sets isBaseline=false for every route in the dataset. */
  clearAllBaselines(): Promise<void>;
  save(route: Route): Promise<Route>;
  update(route: Route): Promise<Route>;
}

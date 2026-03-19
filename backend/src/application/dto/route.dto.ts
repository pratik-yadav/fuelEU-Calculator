import type { Route } from '../../domain/entities/route.entity';
import type { FuelType, VesselType } from '../../types';

export interface RouteResponseDto {
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

export interface ComparisonResponseDto {
  routeId: string;
  ghgIntensity: number;
  baselineGhgIntensity: number;
  percentDiff: number;
  compliant: boolean;
}

export class RouteMapper {
  static toDto(route: Route): RouteResponseDto {
    return {
      id: route.id,
      routeId: route.routeId,
      vesselType: route.vesselType,
      fuelType: route.fuelType,
      year: route.year,
      ghgIntensity: route.ghgIntensity,
      fuelConsumption: route.fuelConsumption,
      distance: route.distance,
      totalEmissions: route.totalEmissions,
      isBaseline: route.isBaseline,
    };
  }

  static toDtoList(routes: Route[]): RouteResponseDto[] {
    return routes.map(RouteMapper.toDto);
  }
}

import type { PrismaClient } from '@prisma/client';
import { Route } from '../../domain/entities/route.entity';
import type { IRouteRepository, RouteFilters } from '../../domain/repositories/route.repository';

export class PrismaRouteRepository implements IRouteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(row: {
    id: string;
    routeId: string;
    fuelType: string;
    ghgIntensity: number;
    fuelConsumption: number;
    distance: number;
    totalEmissions: number;
    isBaseline: boolean;
    year: number;
  }): Route {
    return new Route({
      id: row.id,
      routeId: row.routeId,
      vesselType: 'Cargo',
      fuelType: row.fuelType,
      year: row.year,
      ghgIntensity: row.ghgIntensity,
      fuelConsumption: row.fuelConsumption,
      distance: row.distance,
      totalEmissions: row.totalEmissions,
      isBaseline: row.isBaseline,
    });
  }

  async findAll(filters?: RouteFilters): Promise<Route[]> {
    const rows = await this.prisma.route.findMany({
      where: {
        ...(filters?.fuelType && { fuelType: filters.fuelType }),
        ...(filters?.year && { year: filters.year }),
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Route | null> {
    const row = await this.prisma.route.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    const row = await this.prisma.route.findUnique({ where: { routeId } });
    return row ? this.toDomain(row) : null;
  }

  async findBaseline(): Promise<Route | null> {
    const row = await this.prisma.route.findFirst({ where: { isBaseline: true } });
    return row ? this.toDomain(row) : null;
  }

  async clearAllBaselines(): Promise<void> {
    await this.prisma.route.updateMany({ where: { isBaseline: true }, data: { isBaseline: false } });
  }

  async save(route: Route): Promise<Route> {
    const row = await this.prisma.route.create({
      data: {
        id: route.id,
        routeId: route.routeId,
        fuelType: route.fuelType,
        ghgIntensity: route.ghgIntensity,
        fuelConsumption: route.fuelConsumption,
        distance: route.distance,
        totalEmissions: route.totalEmissions,
        isBaseline: route.isBaseline,
        year: route.year,
      },
    });
    return this.toDomain(row);
  }

  async update(route: Route): Promise<Route> {
    const row = await this.prisma.route.update({
      where: { id: route.id },
      data: {
        fuelType: route.fuelType,
        ghgIntensity: route.ghgIntensity,
        fuelConsumption: route.fuelConsumption,
        distance: route.distance,
        totalEmissions: route.totalEmissions,
        isBaseline: route.isBaseline,
        year: route.year,
      },
    });
    return this.toDomain(row);
  }
}

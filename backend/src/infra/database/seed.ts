import { getPrismaClient, disconnectPrisma } from './prisma.client';

const routes = [
  {
    id: 'a1b2c3d4-0001-0000-0000-000000000001',
    routeId: 'R001',
    fuelType: 'HFO',
    ghgIntensity: 91.7442,
    fuelConsumption: 150,
    distance: 0,
    totalEmissions: 0,
    isBaseline: true,
    year: 2025,
  },
  {
    id: 'a1b2c3d4-0002-0000-0000-000000000002',
    routeId: 'R002',
    fuelType: 'MDO',
    ghgIntensity: 90.76745,
    fuelConsumption: 80,
    distance: 0,
    totalEmissions: 0,
    isBaseline: false,
    year: 2025,
  },
  {
    id: 'a1b2c3d4-0003-0000-0000-000000000003',
    routeId: 'R003',
    fuelType: 'LNG',
    ghgIntensity: 75.5,
    fuelConsumption: 100,
    distance: 0,
    totalEmissions: 0,
    isBaseline: false,
    year: 2025,
  },
  {
    id: 'a1b2c3d4-0004-0000-0000-000000000004',
    routeId: 'R004',
    fuelType: 'VLSFO',
    ghgIntensity: 87.2,
    fuelConsumption: 120,
    distance: 0,
    totalEmissions: 0,
    isBaseline: false,
    year: 2025,
  },
  {
    id: 'a1b2c3d4-0005-0000-0000-000000000005',
    routeId: 'R005',
    fuelType: 'Biofuel-Blend',
    ghgIntensity: 60.0,
    fuelConsumption: 90,
    distance: 0,
    totalEmissions: 0,
    isBaseline: false,
    year: 2025,
  },
];

async function seed(): Promise<void> {
  const prisma = getPrismaClient();

  console.log('Seeding database...');

  for (const route of routes) {
    await prisma.route.upsert({
      where: { routeId: route.routeId },
      create: route,
      update: {
        fuelType: route.fuelType,
        ghgIntensity: route.ghgIntensity,
        fuelConsumption: route.fuelConsumption,
        isBaseline: route.isBaseline,
      },
    });
    console.log(`  Upserted route ${route.routeId}`);
  }

  console.log('Seed complete.');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());

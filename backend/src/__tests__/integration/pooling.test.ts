import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from './helpers/build-test-app';
import { makeMockRouteRepo, makeMockComplianceRepo, makeMockBankRepo, makeMockPoolRepo } from './helpers/mock-repos';

let app: FastifyInstance;

beforeEach(async () => {
  app = await buildTestApp({
    routeRepo: makeMockRouteRepo(),
    complianceRepo: makeMockComplianceRepo(),
    bankRepo: makeMockBankRepo(),
    poolRepo: makeMockPoolRepo(),
  });
  await app.ready();
});

describe('POST /pools', () => {
  it('creates pool with two surplus ships', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/pools',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ year: 2025, members: ['R003', 'R005'] }),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(2);
    body.data.forEach((m: Record<string, unknown>) => {
      expect(m).toHaveProperty('shipId');
      expect(m).toHaveProperty('cbBefore');
      expect(m).toHaveProperty('cbAfter');
    });
  });

  it('returns 422 when total pool CB is negative', async () => {
    // R001 has large deficit (HFO, 150t) — two of them → total CB is very negative
    const { vi } = await import('vitest');
    const repo = makeMockRouteRepo();
    // Make both "ships" use HFO with very high ghg
    const { Route } = await import('../../../domain/entities/route.entity');
    const deepDeficit = new Route({ id: 'x', routeId: 'R001', vesselType: 'Cargo', fuelType: 'HFO', year: 2025, ghgIntensity: 99.0, fuelConsumption: 200, distance: 0, totalEmissions: 0, isBaseline: false });
    (repo.findByRouteId as ReturnType<typeof vi.fn>).mockResolvedValue(deepDeficit);

    const appDeficit = await buildTestApp({
      routeRepo: repo,
      complianceRepo: makeMockComplianceRepo(),
      bankRepo: makeMockBankRepo(),
      poolRepo: makeMockPoolRepo(),
    });
    await appDeficit.ready();

    const res = await appDeficit.inject({
      method: 'POST',
      url: '/pools',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ year: 2025, members: ['R001', 'R002'] }),
    });
    expect(res.statusCode).toBe(422);
  });

  it('returns 400 for less than 2 members', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/pools',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ year: 2025, members: ['R003'] }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for missing year', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/pools',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ members: ['R003', 'R005'] }),
    });
    expect(res.statusCode).toBe(400);
  });
});

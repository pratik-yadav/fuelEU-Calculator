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

describe('GET /compliance/cb', () => {
  it('returns compliance balance for valid shipId + year', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/compliance/cb?shipId=R003&year=2025',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      shipId: 'R003',
      year: 2025,
    });
    expect(typeof body.data.cb).toBe('number');
    expect(typeof body.data.energy).toBe('number');
    // R003 (LNG, 75.5 ghg) should be compliant → positive CB
    expect(body.data.cb).toBeGreaterThan(0);
  });

  it('returns 400 when shipId is missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/compliance/cb?year=2025' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when year is missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/compliance/cb?shipId=R001' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for unknown shipId', async () => {
    const { vi } = await import('vitest');
    const repo = makeMockRouteRepo();
    (repo.findByRouteId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const appWith404 = await buildTestApp({
      routeRepo: repo,
      complianceRepo: makeMockComplianceRepo(),
      bankRepo: makeMockBankRepo(),
      poolRepo: makeMockPoolRepo(),
    });
    await appWith404.ready();
    const res = await appWith404.inject({ method: 'GET', url: '/compliance/cb?shipId=MISSING&year=2025' });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /compliance/adjusted-cb', () => {
  it('returns adjusted CB (CB + banked total)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/compliance/adjusted-cb?shipId=R003&year=2025',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({ shipId: 'R003', year: 2025 });
    expect(typeof body.data.adjustedCb).toBe('number');
    // banked = 0, so adjustedCb should equal cb
    expect(body.data.adjustedCb).toBeCloseTo(body.data.cb, 5);
  });
});

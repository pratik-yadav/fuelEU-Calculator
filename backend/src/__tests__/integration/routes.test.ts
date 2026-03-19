import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from './helpers/build-test-app';
import { makeMockRouteRepo, makeMockComplianceRepo, makeMockBankRepo, makeMockPoolRepo, ROUTES } from './helpers/mock-repos';

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

describe('GET /routes', () => {
  it('returns 200 with list of routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/routes' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(ROUTES.length);
  });
});

describe('GET /routes/comparison', () => {
  it('returns comparison data for all routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/routes/comparison' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    body.data.forEach((item: Record<string, unknown>) => {
      expect(item).toHaveProperty('routeId');
      expect(item).toHaveProperty('ghgIntensity');
      expect(item).toHaveProperty('percentDiff');
      expect(item).toHaveProperty('compliant');
    });
  });

  it('returns 422 when no baseline is set', async () => {
    const noBaselineApp = await buildTestApp({
      routeRepo: makeMockRouteRepo(ROUTES.map((r) => {
        // Return routes but baseline returns null
        return r;
      })),
      complianceRepo: makeMockComplianceRepo(),
      bankRepo: makeMockBankRepo(),
      poolRepo: makeMockPoolRepo(),
    });
    // Override findBaseline to return null
    const { vi } = await import('vitest');
    const repo = makeMockRouteRepo();
    (repo.findBaseline as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const appNoBaseline = await buildTestApp({
      routeRepo: repo,
      complianceRepo: makeMockComplianceRepo(),
      bankRepo: makeMockBankRepo(),
      poolRepo: makeMockPoolRepo(),
    });
    await appNoBaseline.ready();
    const res = await appNoBaseline.inject({ method: 'GET', url: '/routes/comparison' });
    expect(res.statusCode).toBe(422);
  });
});

describe('POST /routes/:id/baseline', () => {
  it('sets baseline and returns updated route', async () => {
    const res = await app.inject({ method: 'POST', url: '/routes/id-R003/baseline' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
  });

  it('returns 404 for unknown route id', async () => {
    const repo = makeMockRouteRepo();
    const { vi } = await import('vitest');
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const appWith404 = await buildTestApp({
      routeRepo: repo,
      complianceRepo: makeMockComplianceRepo(),
      bankRepo: makeMockBankRepo(),
      poolRepo: makeMockPoolRepo(),
    });
    await appWith404.ready();
    const res = await appWith404.inject({ method: 'POST', url: '/routes/non-existent/baseline' });
    expect(res.statusCode).toBe(404);
  });
});

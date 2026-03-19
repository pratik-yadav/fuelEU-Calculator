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

describe('GET /banking/records', () => {
  it('returns empty list when no records exist', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/banking/records?shipId=R003&year=2025',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toEqual([]);
  });

  it('returns 400 when shipId is missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/banking/records?year=2025' });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /banking/bank', () => {
  it('banks surplus successfully for compliant ship', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/banking/bank',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shipId: 'R003', year: 2025, amount: 1000 }),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.type).toBe('BANKED');
    expect(body.data.amountGco2eq).toBe(1000);
  });

  it('returns 422 when trying to bank from deficit ship', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/banking/bank',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shipId: 'R001', year: 2025, amount: 1000 }),
    });
    expect(res.statusCode).toBe(422);
  });

  it('returns 400 for invalid body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/banking/bank',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shipId: 'R003' }), // missing year + amount
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /banking/apply', () => {
  it('applies banked surplus against deficit', async () => {
    const appWithBalance = await buildTestApp({
      routeRepo: makeMockRouteRepo(),
      complianceRepo: makeMockComplianceRepo(),
      bankRepo: makeMockBankRepo([], 50000), // 50000 net banked
      poolRepo: makeMockPoolRepo(),
    });
    await appWithBalance.ready();

    const res = await appWithBalance.inject({
      method: 'POST',
      url: '/banking/apply',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shipId: 'R001', year: 2025, amount: 1000 }),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.type).toBe('APPLIED');
    expect(body.data.amountGco2eq).toBe(-1000);
  });

  it('returns 422 when applying to surplus ship', async () => {
    const appWithBalance = await buildTestApp({
      routeRepo: makeMockRouteRepo(),
      complianceRepo: makeMockComplianceRepo(),
      bankRepo: makeMockBankRepo([], 50000),
      poolRepo: makeMockPoolRepo(),
    });
    await appWithBalance.ready();

    const res = await appWithBalance.inject({
      method: 'POST',
      url: '/banking/apply',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shipId: 'R003', year: 2025, amount: 1000 }),
    });
    expect(res.statusCode).toBe(422);
  });
});

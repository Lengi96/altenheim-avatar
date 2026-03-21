import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

let authToken: string;
const RESIDENT_ID = 'demo-resident-id-0000-000000000001';

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@altenheim.de', password: 'admin123' });
  authToken = res.body.token;
});

describe('GET /api/schedules?residentId=', () => {
  it('returns schedules for resident', async () => {
    const res = await request(app)
      .get(`/api/schedules?residentId=${RESIDENT_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/schedules', () => {
  it('creates a schedule', async () => {
    const res = await request(app)
      .post('/api/schedules')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        residentId: RESIDENT_ID,
        type: 'medication',
        title: 'Abendmedikamente',
        cronExpression: '0 20 * * *',
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Abendmedikamente');
  });
});

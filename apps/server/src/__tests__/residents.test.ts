import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

let authToken: string;
const createdIds: string[] = [];

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@altenheim.de', password: 'admin123' });
  authToken = res.body.token;
});

afterAll(async () => {
  await prisma.resident.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.$disconnect();
});

describe('GET /api/residents', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/api/residents');
    expect(res.status).toBe(401);
  });

  it('returns residents list', async () => {
    const res = await request(app)
      .get('/api/residents')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/residents/:id (no auth required for kiosk)', () => {
  it('returns resident without auth', async () => {
    const res = await request(app).get('/api/residents/demo-resident-id-0000-000000000001');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Maria Müller');
  });
});

describe('POST /api/residents', () => {
  it('creates a resident', async () => {
    const res = await request(app)
      .post('/api/residents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Hans Schmidt', roomNumber: '5B', language: 'de' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Hans Schmidt');
    if (res.body.id) createdIds.push(res.body.id);
  });

  it('returns 400 for missing name', async () => {
    const res = await request(app)
      .post('/api/residents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ roomNumber: '5B' });
    expect(res.status).toBe(400);
  });
});

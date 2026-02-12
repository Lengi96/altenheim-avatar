import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type RowList = Array<Record<string, unknown>>;

const selectQueue: RowList[] = [];
const updateQueue: RowList[] = [];

function createSelectChain() {
  return {
    from() {
      return this;
    },
    innerJoin() {
      return this;
    },
    where() {
      return this;
    },
    orderBy() {
      return this;
    },
    limit() {
      return Promise.resolve(selectQueue.shift() ?? []);
    },
  };
}

const dbMock = {
  select: vi.fn(() => createSelectChain()),
  update: vi.fn(() => ({
    set() {
      return this;
    },
    where() {
      return this;
    },
    returning() {
      return Promise.resolve(updateQueue.shift() ?? []);
    },
  })),
  insert: vi.fn(() => ({
    values() {
      return this;
    },
    onConflictDoUpdate() {
      return this;
    },
    returning() {
      return Promise.resolve([]);
    },
  })),
  delete: vi.fn(() => ({
    where() {
      return this;
    },
    returning() {
      return Promise.resolve([]);
    },
  })),
};

vi.mock('../src/db/index.js', () => ({
  db: dbMock,
}));

vi.mock('../src/services/claude.js', () => ({
  streamChat: vi.fn(),
}));

function makeToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
}

describe('Security route guards', () => {
  let app: import('express').Express;

  beforeAll(async () => {
    process.env.DATABASE_URL ||= 'postgres://test:test@localhost:5432/test_db';
    process.env.JWT_SECRET ||= 'test-secret-32-characters-minimum-123';
    process.env.CORS_ORIGIN ||= 'http://localhost:5173';

    const mod = await import('../src/app.js');
    app = mod.createApp();
  });

  beforeEach(() => {
    selectQueue.length = 0;
    updateQueue.length = 0;
    vi.clearAllMocks();
  });

  it('rejects caregiver chat start without residentId', async () => {
    const token = makeToken({
      userId: 'u1',
      facilityId: 'f1',
      role: 'caregiver',
    });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'Hallo',
        mode: 'pfleger',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('residentId');
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  it('blocks ending conversations outside staff facility', async () => {
    const token = makeToken({
      userId: 'u1',
      facilityId: 'f1',
      role: 'caregiver',
    });

    selectQueue.push(
      [{ id: 'c1', residentId: 'r-outside' }],
      [{ facilityId: 'f-outside' }],
    );

    const res = await request(app)
      .post('/api/conversations/c1/end')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Kein Zugriff');
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it('blocks biography update across facilities', async () => {
    const token = makeToken({
      userId: 'u1',
      facilityId: 'f1',
      role: 'admin',
    });

    selectQueue.push([{ id: 'bio1', residentId: 'r-outside', facilityId: 'f-outside' }]);

    const res = await request(app)
      .put('/api/biographies/bio1')
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 'updated' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Kein Zugriff');
    expect(dbMock.update).not.toHaveBeenCalled();
  });
});

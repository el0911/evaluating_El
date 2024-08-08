import request from 'supertest';
import { prisma } from '../lib/prisma'
import { app } from '../src/index'; // Assuming your express app is exported from app.ts

import { createClient } from 'redis-mock';

// Mock the redis client
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => {
      return {
        add: jest.fn(),
        process: jest.fn(),
      };
    }),
  };
});

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $disconnect: jest.fn(),
    flow: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where.triggerEvent === 'user_delete') {
          return Promise.resolve({
            id: 1,
            triggerEvent: 'user_delete',
            actions: [
              {
                id: 1,
                type: 'email',
                emailSubject: 'Account Deleted',
                emailBody: 'Your account has been deleted.',
                delayMinutes: 0,
                order: 1,
              },
              {
                id: 2,
                type: 'delay',
                emailSubject: null,
                emailBody: null,
                delayMinutes: 10,
                order: 2,
              },
            ],
          });
        }
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 1 || where.triggerEvent === 'user_delete') {
          return Promise.resolve({
            id: 1,
            triggerEvent: 'user_delete',
            actions: [
              {
                id: 1,
                type: 'email',
                emailSubject: 'Account Deleted',
                emailBody: 'Your account has been deleted.',
                delayMinutes: 0,
                order: 1,
              },
              {
                id: 2,
                type: 'delay',
                emailSubject: null,
                emailBody: null,
                delayMinutes: 10,
                order: 2,
              },
            ],
          });
        }
        return Promise.resolve(null);
      }),
      delete: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          triggerEvent: 'user_delete',
          actions: [
            {
              id: 1,
              type: 'email',
              emailSubject: 'Account Deleted',
              emailBody: 'Your account has been deleted.',
              delayMinutes: 0,
              order: 1,
            },
          ],
        },
        {
          id: 2,
          triggerEvent: 'user_update',
          actions: [
            {
              id: 2,
              type: 'delay',
              emailSubject: null,
              emailBody: null,
              delayMinutes: 5,
              order: 1,
            },
          ],

        },
      ]),
      create: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({
          id: 1,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        if (where.id === 1) {
          return Promise.resolve({
            id: 1,
            ...data,
            triggerEvent: 'user_updated',
            createdAt: new Date('2024-08-07T12:00:00.000Z'),
            updatedAt: new Date(),
          });
        }
        return Promise.resolve(null);
      }),
      deleteMany: jest.fn().mockResolvedValue({
        count: 1,
      }),
    },
    action: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
  };
});

beforeAll(async () => {
  // Reset the test database
  await prisma.action.deleteMany();
  await prisma.flow.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect(); // i dont think i need to do this but for clarity sake
});

describe('Flow API', () => {
  let flowId: number;

  it('should create a new flow', async () => {
    const res = await request(app)
      .post('/api/flows')
      .send({
        triggerEvent: 'user_delete_1',
        actions: [
          { type: 'email', order: 1, emailSubject: 'Goodbye', emailBody: 'We\'re sad to see you go.' },
          { type: 'delay', order: 2, delayMinutes: 10 },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    flowId = res.body.id;
  });

  it('should start a new event sequence with a flow', async () => {
    const res = await request(app)
      .post('/api/event')
      .send({ eventName: 'user_delete', userEmail: 'user@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Flow execution queued' });
  });

  it('should not create a flow with duplicate triggerEvent', async () => {
    const res = await request(app)
      .post('/api/flows')
      .send({
        triggerEvent: 'user_delete',
        actions: [
          { type: 'email', order: 1, emailSubject: 'Goodbye', emailBody: 'We\'re sad to see you go.' },
        ],
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Flow with this triggerEvent already exists');
  });

  it('should get all flows', async () => {
    const res = await request(app).get('/api/flows');

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it('should update a flow', async () => {
    const res = await request(app)
      .put(`/api/flows/${flowId}`)
      .send({
        triggerEvent: 'user_delete',
        actions: [
          { type: 'email', order: 1, emailSubject: 'Sorry to see you leave', emailBody: 'We hope to see you back soon.' },
          { type: 'delay', order: 2, delayMinutes: 15 },
        ],
      });

    expect(res.statusCode).toBe(200);

  });

  it('should delete a flow', async () => {
    console.log(flowId)
    const res = await request(app).delete(`/api/flows/${flowId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Flow deleted successfully');
  });

  it('should return 404 for a non-existent flow', async () => {
    const res = await request(app).get('/flows/9999');

    expect(res.statusCode).toBe(404);
  });
});

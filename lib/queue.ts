import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const createRedisConnection = () => new IORedis(`${process.env.REDIS_URL}`, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

export const flowQueue = new Queue('flowQueue', { 
  connection: createRedisConnection()
});
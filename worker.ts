import { Worker } from 'bullmq';
import { executeFlow } from './lib/flowExecutor.js';
import IORedis from 'ioredis';

const connection = new IORedis(`${process.env.REDIS_URL}`,{
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });

const worker = new Worker('flowQueue', async (job) => {
  if (job.name === 'executeFlow') {
    const { flowId, userEmail, currentActionOrder = 0, retryCount = 0 } = job.data;
    await executeFlow(flowId, userEmail, currentActionOrder, retryCount);
  }
}, { connection });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    if (job) {
        console.error(`Job ${job.id} failed with error ${err.message}`);
    }
 });
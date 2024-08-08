const RedisMock = require('redis-mock');
const IORedis = require('ioredis');

// Mock the `ioredis` module
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return RedisMock.createClient();
  });
});

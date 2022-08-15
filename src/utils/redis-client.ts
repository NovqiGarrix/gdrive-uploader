import Redis from 'ioredis';

export class RedisClient {

    public static client: Redis;

    public static getClient(): Redis {
        if (RedisClient.client) return RedisClient.client;

        const REDIS_CONNECTION_STRING = process.env.REDIS_CONNECTION_STRING!

        const newRedis = new Redis(REDIS_CONNECTION_STRING);
        RedisClient.client = newRedis

        return RedisClient.client
    }

}
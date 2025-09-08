const { createClient }  = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-13862.c266.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 13862
    }
});

module.exports = redisClient;
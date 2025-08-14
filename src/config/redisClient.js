const redis = require("redis");

const redisConnectionUrl =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

const redisClient = redis.createClient({
  url: redisConnectionUrl,
});

redisClient.on("error", (err) => {
  console.error("Redis Client 에러:", err);
});

(async () => {
  await redisClient.connect();
  console.log(`Redis 연결됨: ${redisConnectionUrl}`);
})();

module.exports = redisClient;

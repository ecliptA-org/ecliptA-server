const redis = require("redis");
require('dotenv').config();

const redisConnectionUrl =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

if (!redisConnectionUrl || redisConnectionUrl.includes('undefined')) {
  console.error('Redis URL 환경변수가 올바르게 설정되지 않았습니다:', redisConnectionUrl);
  process.exit(1);
}

const redisClient = redis.createClient({
  url: redisConnectionUrl,
});

redisClient.on("error", (err) => {
  console.error("Redis Client 에러:", err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log(`Redis 연결됨: ${redisConnectionUrl}`);
  } catch (err) {
    console.error("Redis 연결 실패:", err);
    process.exit(1);
  }
})(); 

// 10초마다 PING으로 연결 상태 유지 
setInterval(() => {
  redisClient.ping().catch(() => {});
}, 10000);

process.on('SIGINT', async () => {
  await redisClient.quit();
  process.exit(0);
});

module.exports = redisClient;

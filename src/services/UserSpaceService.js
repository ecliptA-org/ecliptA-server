const UserSpaceRepository = require("../repositories/UserSpaceRepository");
const redisClient = require("../config/redisClient.js");

const DuplicateError = require("../errors/DuplicateError.js");

const UserSpaceService = {
  async createUserSpace(user_id, userSpaceCreateDto) {
    const { longitude, latitude, space_name, memo } = userSpaceCreateDto;

    // 공간 중복 체크 + 생성
    let space = await UserSpaceRepository.findSpace(longitude, latitude);
    let space_id = space
      ? space.space_id
      : await UserSpaceRepository.insertSpace(longitude, latitude);

    // 유저-공간-이름 중복 체크
    const isDuplicate = await UserSpaceRepository.checkDuplicate(
      user_id,
      space_id,
      space_name
    );
    if (isDuplicate) {
      throw new DuplicateError("중복 생성 불가");
    }

    // 신규 user_space 생성
    const user_space_id = await UserSpaceRepository.createUserSpace(
      user_id,
      space_id,
      space_name,
      memo
    );
    return user_space_id;
  },

  // 유저-공간 클리어

  // 유저-공간상세 조회
  async getUserSpaceDetail(userSpaceIdDto) {
    const { user_space_id } = userSpaceIdDto;

    const rows = await UserSpaceRepository.findById(user_space_id);
    if (rows.length === 0) {
      throw new Error("NOT_FOUND");
    }
    return rows[0];
  },

  // 명성치 조회
  async getUserSpaceScore(userSpaceIdDto) {
    const { user_space_id } = userSpaceIdDto;

    const score = await UserSpaceRepository.getUserSpaceScore(user_space_id);

    return score;
  },

  // 유저-공간 클리어 랭킹 조회 (Redis 캐시)
  async getRankingCache(user_space_id) {
    const cacheKey = `ranking:${user_space_id}`;

    // Redis 캐시 확인
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      try {
        console.log(`Redis 캐시 히트: ${cacheKey}`);
        return JSON.parse(cached);
      } catch (e) { 
        return undefined;
      }
    }

    console.log(`DB 조회: ${cacheKey}`);

    // DB 조회
    const snapshotRows = await UserSpaceRepository.getPreviousRanking(
      user_space_id
    );
    const prevRankMap = {};
    snapshotRows.forEach((row) => {
      prevRankMap[row.user_id] = row.prev_rank;
    });

    const currentRows = await UserSpaceRepository.getCurrentRanking(
      user_space_id
    );
    const rankingList = [];

    currentRows.forEach((row, idx) => {
      const user_id = row.user_id;
      const current_rank = idx + 1;
      const prev_rank = prevRankMap[user_id] || null;

      let movement = null;
      if (prev_rank === null || prev_rank === undefined) {
        movement = "UP"; // 신규 진입
      } else if (current_rank < prev_rank) {
        movement = "UP";
      } else if (current_rank > prev_rank) {
        movement = "DOWN";
      } else {
        movement = "SAME";
      }

      rankingList.push({
        user_id,
        clear_time: row.clear_time,
        current_rank,
        prev_rank,
        movement,
      });
    });

    // Redis 캐시 저장
    await redisClient.set(cacheKey, JSON.stringify(rankingList), { EX: 60 });

    return rankingList;
  },
};

module.exports = { UserSpaceService };

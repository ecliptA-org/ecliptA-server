const { UserSpaceService } = require("../services/UserSpaceService.js");

const { UserSpaceCreateDto } = require("../dtos/request/UserSpaceCreateDto.js");
const { UserSpaceIdDto } = require("../dtos/UserSpaceIdDto");
const {
  UserSpaceDetailDto,
} = require("../dtos/response/UserSpaceDetailDto.js");

const DuplicateError = require("../errors/DuplicateError.js");

const UserSpaceController = {
  // 공간 저장
  async createUserSpace(req, res) {
    try {
      const { user_id } = req.user;

      const userSpaceCreateDto = new UserSpaceCreateDto(req.body);

      const user_space_id = await UserSpaceService.createUserSpace(
        user_id,
        userSpaceCreateDto
      );

      res.status(201).json({ result: "success", user_space_id });
    } catch (e) {
      if (e instanceof DuplicateError) {
        return res.status(409).json({ error: e.message });
      }
      console.error(e);
      res.status(500).json({ error: "서버 오류" });
    }
  },

  // 유저-공간에 아이템 배치 (실질적 공간 탈출 생성)

  // 유저-공간 클리어

  // 유저-공간상세 조회
  async getUserSpaceDetail(req, res) {
    try {
      const user_space_id = req.params.user_space_id;
      const userSpaceIdDto = new UserSpaceIdDto(user_space_id);

      const space = await UserSpaceService.getUserSpaceDetail(userSpaceIdDto);

      const responseDto = new UserSpaceDetailDto(space);

      res.status(200).json(responseDto);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "서버 오류" });
    }
  },

  // 명성치 조회
  async getUserSpaceScore(req, res) {
    try {
      const user_space_id = req.params.user_space_id;
      const userSpaceIdDto = new UserSpaceIdDto(user_space_id);

      const score = await UserSpaceService.getUserSpaceScore(userSpaceIdDto);

      res.status(200).json({ score });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "서버 오류" });
    }
  },

  // 랭킹 가져오기
  async getRanking(req, res) {
    const user_space_id = Number(req.params.user_space_id);

    if (!user_space_id || isNaN(user_space_id)) {
      return res.status(400).json({ error: "user_space_id 오류" });
    }

    try {
      const rankingList = await rankingService.getRankingCache(user_space_id);
      res.status(200).json({
        result: "success",
        ranking: rankingList,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "서버 오류" });
    }
  },
};

module.exports = UserSpaceController;

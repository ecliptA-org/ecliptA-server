const UserSpaceRepository = require("../repositories/UserSpaceRepository");

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
};

module.exports = { UserSpaceService };

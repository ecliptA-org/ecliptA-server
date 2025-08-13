const UserSpaceRepository = require('../repositories/UserSpaceRepository');
const { UserSpaceCreateDto } = require('../dtos/UserSpaceDto');
const { UserSpaceScoreDto } = require('../dtos/UserSpaceScoreDto');

const UserSpaceService = {
    async createUserSpace(user_id, createDto) {
        // DTO 유효성 체크
        const { longitude, latitude, space_name, memo } = new UserSpaceCreateDto(createDto);

        // 공간 중복 체크 + 생성
        let space = await UserSpaceRepository.findSpace(longitude, latitude);
        let space_id = space ? space.space_id : await UserSpaceRepository.insertSpace(longitude, latitude);

        // 유저-공간-이름 중복 체크
        const isDuplicate = await UserSpaceRepository.checkDuplicate(user_id, space_id, space_name);
        if (isDuplicate) {
            throw new Error('이미 같은 공간 탈출을 생성하셨습니다.');
        }

        // 신규 user_space 생성
        const user_space_id = await UserSpaceRepository.createUserSpace(user_id, space_id, space_name, memo);
        return user_space_id;
    },

    // 명성치 조회
    async getUserSpaceScore(user_space_id) {
        // DTO 유효성 체크
        const { userSpaceId  } = new UserSpaceScoreDto(user_space_id);
        const score = await UserSpaceRepository.getUserSpaceScore(userSpaceId);

        return score;
    }
};

module.exports = { UserSpaceService };
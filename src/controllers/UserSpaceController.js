const {
  UserSpaceService
} = require('../services/UserSpaceService.js');

const UserSpaceController = {
  async createUserSpace(req, res) {
    try {
      const { user_id } = req.user;
      const user_space_id = await UserSpaceService.createUserSpace(user_id, req.body);
      res.status(201).json({ result: 'success', user_space_id });
    } catch (e) {
      if (e.message?.includes('중복')) {
        return res.status(400).json({ error: e.message });
      }
      console.error(e);
      res.status(500).json({ error: '서버 오류' });
    }
  },

  // 명성치 조회
  async getUserSpaceScore(req, res) {
    try {
      const user_space_id = Number(req.params.user_space_id);
      const score = await UserSpaceService.getUserSpaceScore(user_space_id);
      
      res.status(200).json({ score });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: '서버 오류' });
    }
  }
};

module.exports = UserSpaceController;

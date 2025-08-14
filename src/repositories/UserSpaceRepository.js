const pool = require("../config/db.js");

const UserSpaceRepository = {
  // POINT(경도, 위도)로 공간 조회
  async findSpace(longitude, latitude) {
    const [spaces] = await pool.query(
      `SELECT space_id 
            FROM space 
            WHERE ST_Equals(location, ST_GeomFromText('POINT(${longitude} ${latitude})'))`
    );
    return spaces[0];
  },

  // 공간이 없으면 생성
  async insertSpace(longitude, latitude) {
    const [result] = await pool.query(
      `INSERT INTO space (location) 
            VALUES (ST_GeomFromText('POINT(${longitude} ${latitude})'))`
    );
    return result.insertId;
  },

  // 같은 유저+공간+이름으로 중복 생성 불가능
  async checkDuplicate(user_id, space_id, space_name) {
    const [rows] = await pool.query(
      `SELECT user_space_id 
            FROM user_space 
            WHERE user_id = ? AND space_id = ? AND space_name = ?`,
      [user_id, space_id, space_name]
    );
    return rows.length > 0;
  },

  // 유저 공간 생성
  async createUserSpace(user_id, space_id, space_name, memo) {
    const [result] = await pool.query(
      `INSERT INTO user_space (user_id, space_id, space_name, memo, created_at, updated_at, status)
            VALUES (?, ?, ?, ?, NOW(), NOW(), 'ACTIVE')`,
      [user_id, space_id, space_name, memo]
    );
    return result.insertId;
  },

  // space_id로 유저 공간 조회
  async findById(user_space_id) {
    const [rows] = await pool.query(
      `SELECT user_space_id, space_name, memo
             FROM user_space
             WHERE user_space_id = ?`,
      [user_space_id]
    );
    return rows;
  },

  // 명성치 조회
  async getUserSpaceScore(user_space_id) {
    const [rows] = await pool.query(
      `SELECT score 
            FROM user_space
            WHERE user_space_id = ?`,
      [user_space_id]
    );
    console.log("user_space_id:", typeof user_space_id, user_space_id);
    console.log("명성치 rows:", rows);
    return rows[0] ? rows[0].score : 0;
  },

  // 랭킹 가져오기
  async getRanking(req, res) {
    const user_space_id = Number(req.params.user_space_id);

    if (!user_space_id || isNaN(user_space_id)) {
      return res.status(400).json({ error: "user_space_id 오류" });
    }

    try {
      const rankingList = await UserSpaceService.getRankingCache(user_space_id);
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

module.exports = UserSpaceRepository;

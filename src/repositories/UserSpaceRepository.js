const pool = require('../config/db.js');

const UserSpaceRepository = {
    // POINT(경도, 위도)로 공간 조회
    async findSpace(longitude, latitude) {
        const [spaces] = await pool.query(
            `SELECT space_id 
      FROM space 
      WHERE ST_Equals(location, ST_GeomFromText('POINT(? ?)'))`,
            [longitude, latitude]
        );
        return spaces[0];
    },

    // 공간이 없으면 생성
    async insertSpace(longitude, latitude) {
        const [result] = await pool.query(
            `INSERT INTO space (location) 
      VALUES (ST_GeomFromText('POINT(? ?)'))`,
            [longitude, latitude]
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
};

module.exports = UserSpaceRepository;

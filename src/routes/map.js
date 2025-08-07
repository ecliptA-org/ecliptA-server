const express = require('express');
const pool = require('../config/db');
const auth = require('../middlewares/auth');
const router = express.Router();

// 공간(마커) 범위 조회
router.get('', async (req, res) => {
    const {
        ne_lat, ne_lng, sw_lat, sw_lng
    } = req.query;

    // 필수값 체크 (좌표값)
    if (
        !ne_lat || !ne_lng || !sw_lat || !sw_lng
        || isNaN(Number(ne_lat)) || isNaN(Number(ne_lng))
        || isNaN(Number(sw_lat)) || isNaN(Number(sw_lng))
    ) {
        return res.status(400).json({ error: "좌표 파라미터가 올바르지 않습니다." });
    }

    try {
        // 위도: ST_Y(location), 경도: ST_X(location)
        const [spaces] = await pool.query(
            `SELECT
                space_id,
                ST_X(location) AS longitude,
                ST_Y(location) AS latitude
            FROM space
            WHERE
                ST_Y(location) BETWEEN ? AND ?
                AND ST_X(location) BETWEEN ? AND ?`, // 경도, 위도 범위 조회
            [
                Number(sw_lat), Number(ne_lat), // 위도
                Number(sw_lng), Number(ne_lng), // 경도
            ]
        );

        res.status(200).json({
            result: 'success',
            spaces
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    }
});

module.exports = router;
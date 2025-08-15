const express = require('express');
const pool = require('../config/db');
const auth = require('../middlewares/auth');
const router = express.Router();

// 유저 소지금 조회
router.get('/', auth, async (req, res) => {
    const { user_id } = req.user;
    console.log(`유저 소지금 조회`);
    try {
        // user에서 소지금 조회
        const [rows] = await pool.query(
            `SELECT 
                u.user_id, u.coin
             FROM user u
             WHERE u.user_id = ?`,
            [user_id]
        );

        console.log(`유저 ${user_id}의 소지금 조회:`, rows);

        res.status(200).json({ result: 'success', coin: rows[0] });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    }
});

module.exports = router;
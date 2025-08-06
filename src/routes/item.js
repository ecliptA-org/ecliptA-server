const express = require('express');
const pool = require('../config/db');
const auth = require('../middlewares/auth');
const router = express.Router();

// 카테고리별 아이템 목록 조회
router.get('/items/:item_category_id', async (req, res) => {
    const { item_category_id } = req.params;

    try {
        // 해당 카테고리의 모든 아이템 조회
        const [rows] = await pool.query(
            'SELECT * FROM item WHERE item_category_id = ?',
            [item_category_id]
        );

        // 결과 반환
        res.status(200).json({ result: 'success', items: rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    }
});

// 아이템 구매
router.post('/items/purchase', auth, async (req, res) => {
    const { item_id } = req.body;
    const { user_id } = req.user;

    if (!item_id) {
        return res.status(400).json({ error: 'item_id는 필수입니다.' });
    }

    console.log(`아이템 구매 요청: user_id=${user_id}, item_id=${item_id}`);

    try {
        // 아이템 유효성 검사, 가격 조회
        const [items] = await pool.query('SELECT * FROM item WHERE item_id = ?', [item_id]);
        if (items.length === 0) {
            return res.status(404).json({ error: '존재하지 않는 아이템입니다.' });
        }
        const item_price = BigInt(items[0].price);
        console.log(`아이템 가격: ${item_price}`);

        // 유저 소지금 조회
        const [users] = await pool.query('SELECT coin FROM user WHERE user_id = ?', [user_id]);
        if (users.length === 0) return res.status(404).json({ error: '존재하지 않는 유저입니다.' });
        const user_coin = BigInt(users[0].coin);
        console.log(`유저 소지금: ${user_coin}`);

        // 소지금 확인
        if (user_coin < item_price) {
            return res.status(400).json({ error: '소지금이 부족합니다.' });
        }

        // 구매 내역에 이미 해당 아이템이 있는지 확인
        const [exists] = await pool.query(
            'SELECT 1 FROM user_item WHERE user_id = ? AND item_id = ? LIMIT 1',
            [user_id, item_id]
        );
        if (exists.length > 0) {
            return res.status(400).json({ error: '이미 구매한 아이템입니다.' });
        }

        // 트랜잭션
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // coin 차감
            await conn.query(
                'UPDATE user SET coin = coin - ? WHERE user_id = ?',
                [item_price.toString(), user_id]
            );

            // 구매내역 저장
            await conn.query(
                'INSERT INTO user_item (user_id, item_id, is_purchased, purchased_at) VALUES (?, ?, ?, NOW())',
                [user_id, item_id, true]
            );

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

        res.status(201).json({
            result: 'success',
            user_id,
            item_id
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    }
});

// 유저가 구매한 아이템 목록 조회
router.get('/items', auth, async (req, res) => {
    const { user_id } = req.user;

    try {
        // user_item에서 유저별 구매한 아이템들 조인 조회
        const [rows] = await pool.query(
            `SELECT 
                i.item_id, i.item_name, i.item_category_id,
                ui.purchased_at
             FROM user_item ui
             JOIN item i ON ui.item_id = i.item_id
             WHERE ui.user_id = ?
             ORDER BY ui.purchased_at DESC`,
            [user_id]
        );

        res.status(200).json({ result: 'success', items: rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    }
});

module.exports = router;

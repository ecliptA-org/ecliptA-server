const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const UserSpaceController = require('../controllers/UserSpaceController');
const pool = require('../config/db.js');

// 공간 저장
router.post('/', auth, UserSpaceController.createUserSpace);

// 유저-공간에 아이템 배치 (실질적 공간 탈출 생성)
router.post('/:user_space_id/items', auth, async (req, res) => {
    const user_space_id = Number(req.params.user_space_id);
    const { items } = req.body;
    const { user_id } = req.user;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'items 배열이 필요합니다.' });
    }

    const insertCount = [];
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // user_space 권한 확인
        const [userSpaces] = await conn.query(
            'SELECT user_space_id FROM user_space WHERE user_space_id = ? AND user_id = ?',
            [user_space_id, user_id]
        );

        if (userSpaces.length === 0) {
            await conn.rollback();
            return res.status(403).json({
                error: '해당 공간에 대한 권한이 없습니다.',
                debug: {
                    user_id,
                    user_space_id
                }
            });

        }


        // 아이템 정보 저장
        const failedItems = [];

        for (const item of items) {
            if (!item.item_id || !item.item_location || item.detail == undefined) {
                failedItems.push(item);
                continue;
            }

            await conn.query(
                `INSERT INTO space_item (user_space_id, item_id, item_location, detail) VALUES (?, ?, ST_GeomFromGeoJSON(?), ?)`,
                [Number(user_space_id), item.item_id, JSON.stringify(item.item_location), item.detail]

            );
            insertCount.push(item.item_id);
        }

        await conn.commit();
        res.status(201).json({
            result: 'success',
            items_inserted: insertCount.length,
            failed_items: failedItems.length > 0 ? failedItems : undefined
        });

    } catch (e) {
        await conn.rollback();
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    } finally {
        conn.release();
    }
});

// 유저-공간 클리어
router.post('/:user_space_id/clear', auth, async (req, res) => {
    const user_space_id = Number(req.params.user_space_id);
    const { user_id } = req.user;
    const is_success = req.query.is_success !== undefined ? Number(req.query.is_success) : 1;

    if (!user_space_id || isNaN(user_space_id)) {
        return res.status(400).json({ error: 'user_space_id 오류' });
    }
    if (is_success !== 0 && is_success !== 1) {
        return res.status(400).json({ error: 'is_success 값 오류' });
    }

    try {
        // start_time 가져오기
        const [row] = await pool.query(
            `SELECT start_time
            FROM space_ranking 
            WHERE user_space_id = ? AND user_id = ?`,
            [user_space_id, user_id]
        );

        if (!row) {
            return res.status(404).json({ error: '기록 없음' });
        }

        const start_time = row[0].start_time;
        const end_time = new Date();
        const completed_at = end_time;
        const is_success = 1;

        // clear_time 계산
        let clear_time_sec = Math.floor((end_time - start_time) / 1000);
        if (clear_time_sec < 0 || isNaN(clear_time_sec)) {
            clear_time_sec = 0;
            console.log(start_time, '시작 시간 확인');
        }

        // 랭킹 계산
        let ranking = null;
        if (is_success === 1) {
            const [rankRows] = await pool.query(
                `SELECT user_id, clear_time 
                FROM space_ranking 
                WHERE user_space_id = ? AND is_success = 1
                ORDER BY clear_time ASC`,
                [user_space_id]
            );
            // 랭킹 집계
            let ranking = null;
            for (let i = 0; i < rankRows.length; i++) {
                if (rankRows[i].user_id === user_id) {
                    ranking = i + 1;
                    break;
                }
            }
        }

        // DB 업데이트
        await pool.query(
            `UPDATE space_ranking SET
             end_time = ?,
             is_success = ?,
             completed_at = ?,
             clear_time = ?,
             ranking = ?
           WHERE user_space_id = ? AND user_id = ?`,
            [end_time, is_success, completed_at, clear_time_sec, ranking, user_space_id, user_id]
        );

        res.json({
            message: is_success ? '클리어 성공' : '클리어 실패',
            clear_time: clear_time_sec,
            ranking: ranking
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    }
});

// 유저-공간상세 조회
router.get('/:user_space_id', auth, UserSpaceController.getUserSpaceDetail);

// 유저-공간 클리어 랭킹 목록 조회
router.get('/:user_space_id/ranking', auth, async (req, res) => {
    const  user_space_id  = Number(req.params.user_space_id);

    if (!user_space_id || isNaN(user_space_id)) {
        return res.status(400).json({ error: 'user_space_id 오류' });
    }
    try {
        // 이전 랭킹 정보 조회
        const [snapshotRows] = await pool.query(
            `SELECT user_id, prev_rank
           FROM space_ranking_snapshot
           WHERE user_space_id = ?
           AND snapshot_date = (SELECT MAX(snapshot_date) FROM space_ranking_snapshot WHERE user_space_id = ?)
          `,
            [user_space_id, user_space_id]
        );

        // 맵 구조로 유저-랭킹 관리
        const prevRankMap = {};
        snapshotRows.forEach(row => { prevRankMap[row.user_id] = row.prev_rank; });

        // 현재 랭킹 조회
        const [currentRows] = await pool.query(
            `SELECT user_id, clear_time
           FROM space_ranking
           WHERE user_space_id = ?
           AND is_success = 1
           AND completed_at IS NOT NULL
           ORDER BY clear_time ASC
          `,
            [user_space_id]
        );

        // 랭킹 집계
        const rankingList = [];
        currentRows.forEach((row, idx) => {
            const user_id = row.user_id;
            const current_rank = idx + 1;
            const prev_rank = prevRankMap[user_id] || null;
            // 랭킹 변동 계산
            let movement = null;
            if (prev_rank === null || prev_rank === undefined) {
                movement = 'UP'; // 신규 진입
            } else if (current_rank < prev_rank) {
                movement = 'UP';
            } else if (current_rank > prev_rank) {
                movement = 'DOWN';
            } else {
                movement = 'SAME';
            }
            rankingList.push({
                user_id,
                clear_time: row.clear_time,
                current_rank,
                prev_rank,
                movement // UP, DOWN, SAME, NEW
            });
        });
        res.status(200).json({
            result: 'success',
            ranking: rankingList
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    }
});

// 유저-공간 명성치 조회
router.get('/:user_space_id/score', auth, UserSpaceController.getUserSpaceScore);

module.exports = router;
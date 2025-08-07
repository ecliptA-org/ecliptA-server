const express = require('express');
const pool = require('../config/db');
const auth = require('../middlewares/auth');
const router = express.Router();

// 공간 저장
router.post('/', auth, async (req, res) => {
    const { location, space_name, memo } = req.body;
    const { user_id } = req.user;
    const longitude = location.longitude;
    const latitude = location.latitude;

    if (!location || !space_name) {
        return res.status(400).json({ error: 'location, space_name은 필수입니다.' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // location의 space가 이미 있으면 찾고, 없으면 새로 저장
        let space_id;
        // POINT(경도, 위도)로 비교
        const [spaces] = await conn.query(
            `SELECT space_id FROM space WHERE ST_Equals(location, ST_GeomFromText('POINT(? ?)'))`,
            [longitude, latitude]
        );
        if (spaces.length > 0) {
            space_id = spaces[0].space_id;
        } else {
            // 공간이 없으면 저장
            const [spaceResult] = await conn.query(
                `INSERT INTO space (location) VALUES (ST_GeomFromText('POINT(? ?)'))`,
                [longitude, latitude]
            );
            space_id = spaceResult.insertId;
        }

        // 같은 유저+공간+이름으로 중복 생성 불가능
        const [dupes] = await conn.query(
            `SELECT user_space_id FROM user_space WHERE user_id = ? AND space_id = ? AND space_name = ?`,
            [user_id, space_id, space_name]
        );
        if (dupes.length > 0) {
            await conn.rollback();
            return res.status(400).json({ error: '이미 같은 공간 탈출을 생성하셨습니다.' });
        }

        // user_space 저장
        const [userSpaceResult] = await conn.query(`
            INSERT INTO user_space
            (user_id, space_id, space_name, memo, created_at, updated_at, status)
            VALUES (?, ?, ?, ?, NOW(), NOW(), 'ACTIVE')
        `, [user_id, space_id, space_name, memo || null]);
        const user_space_id = userSpaceResult.insertId;

        await conn.commit();
        res.status(201).json({
            result: 'success',
            user_space_id
        });
    } catch (e) {
        await conn.rollback();
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    } finally {
        conn.release();
    }
});

// 유저-공간에 아이템 배치 (실질적 공간 탈출 생성)
router.post('/:user_space_id/items', auth, async (req, res) => {
    const { user_space_id } = req.params;
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
            [Number(user_space_id), user_id]
        );
        if (userSpaces.length === 0) {
            await conn.rollback();
            return res.status(403).json({ error: '해당 공간에 대한 권한이 없습니다.' });
        }

        for (const item of items) {
        const failedItems = [];

        for (const item of items) {
            if (!item.item_id || !item.item_location) {
                failedItems.push(item);
                continue;
            }

            await conn.query(
                `INSERT INTO space_item (user_space_id, item_id, item_location) VALUES (?, ?, ST_GeomFromGeoJSON(?))`,
                [Number(user_space_id), item.item_id, JSON.stringify(item.item_location)]
            );
            insertCount.push(item.item_id);
        }

        await conn.commit();
        res.status(201).json({
            result: 'success',
            items_inserted: insertCount.length,
            failed_items: failedItems.length > 0 ? failedItems : undefined
        });

        await conn.commit();
        res.status(201).json({
            result: 'success',
            items_inserted: insertCount.length
        });
    } catch (e) {
        await conn.rollback();
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    } finally {
        conn.release();
    }
});

// 유저-공간상세 조회
router.get('/:user_space_id', auth, async (req, res) => {
    const { user_space_id } = req.params;
    const user_space_id_num = Number(user_space_id);
    if (!user_space_id_num || isNaN(user_space_id_num)) {
        return res.status(400).json({ error: 'user_space_id 오류' });
    }
    try {
        const [rows] = await pool.query(
            `SELECT user_space_id, space_name, memo
             FROM user_space
             WHERE user_space_id = ?`,
            [user_space_id_num]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: '존재하지 않는 공간 탈출' });
        }
        res.status(200).json({
            result: 'success',
            user_space_id: rows[0].user_space_id,
            space_name: rows[0].space_name,
            memo: rows[0].memo
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    }
});

// 유저-공간 클리어 랭킹 목록 조회
router.get('/:user_space_id/ranking', auth, async (req, res) => {
    const { user_space_id } = req.params;
    const user_space_id_num = Number(user_space_id);
    if (!user_space_id_num || isNaN(user_space_id_num)) {
        return res.status(400).json({ error: 'user_space_id 오류' });
    }

    // 최근 스냅샷 날짜 조회
    const [[{ snapshot_date } = {}]] = await pool.query(
        `SELECT MAX(snapshot_date) AS snapshot_date 
         FROM space_ranking_snapshot 
         WHERE user_space_id = ?`,
        [user_space_id_num]
    );

    // 이전 랭킹 정보 조회
    let prevRankingMap = {};
    if (snapshot_date) {
        const [prevRows] = await pool.query(
            `SELECT user_id, prev_rank FROM space_ranking_snapshot
             WHERE user_space_id = ? AND snapshot_date = ?`,
            [user_space_id_num, snapshot_date]
        );
        // user_id → 이전 순위 map{ user_id: prev_rank }
        prevRankingMap = Object.fromEntries(
            prevRows.map(r => [r.user_id, r.prev_rank])
        );
    }

    // 현재 랭킹 조회
    try {
        const [rows] = await pool.query(
            `SELECT
                sr.user_id,
                u.nickname,
                TIMESTAMPDIFF(SECOND, sr.start_time, sr.end_time) AS clear_time,
                sr.completed_at
             FROM space_ranking sr
             JOIN user u ON sr.user_id = u.user_id
             WHERE sr.user_space_id = ?
               AND sr.is_success = 1
             ORDER BY clear_time ASC, sr.completed_at ASC
             LIMIT 100`,
            [user_space_id_num]
        );

        // 랭킹 변동 계산
    const ranking = rows.map((row, idx) => {
        const curr_rank = idx + 1;
        const prev_rank = prevRankingMap[row.user_id];
        let diff;
        if (prev_rank === undefined) {
            diff = '신규';
        } else if (prev_rank > curr_rank) {
            diff = '▲' + (prev_rank - curr_rank);
        } else if (prev_rank < curr_rank) {
            diff = '▼' + (curr_rank - prev_rank);
        } else {
            diff = '–';
        }
        return {
            rank: curr_rank,
            user_id: row.user_id,
            nickname: row.nickname,
            clear_time: row.clear_time,
            completed_at: row.completed_at,
            diff
        };
    });

        res.status(200).json({
            result: 'success',
            ranking
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '서버 오류' });
    }
});

module.exports = router;
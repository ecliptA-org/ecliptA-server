const express = require('express');
const router = express.Router();
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const auth = require('../middlewares/auth');
const pool = require("../config/db.js");

// S3 Client 생성 
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// 프로필 이미지 다운로드 presigned URL 발급
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.user_id;

        if (!userId) {
            return res.status(400).json({ error: '존재하지 않는 유저입니다.' });
        }

        const [rows] = await pool.query(
            "SELECT image_url FROM profile_img WHERE user_id = ?",
            [userId]
        );

        if (!rows.length || !rows[0].image_url) {
            return res.status(404).json({ error: '프로필 이미지가 존재하지 않습니다.' });
        }
        const s3Key = rows[0].image_url;

        const command = new GetObjectCommand({
            Bucket: 'eclipta',
            Key: s3Key
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1시간 유효
        res.json({ url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 프로필 이미지 업로드 presigned URL 발급 및 DB 저장
router.put('/', auth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        // 파일 확장자 
        const ext = req.query.ext || ".jpg";
        // 자동 파일명 생성: userId + timestamp + random 
        const fileName = `profile_${userId}_${Date.now()}` + ext;

        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.webp') contentType = 'image/webp';

        const s3Key = `profiles/${fileName}`;
        const command = new PutObjectCommand({
            Bucket: 'eclipta',
            Key: s3Key,
            ContentType: contentType
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 600 }); // 10분 

        // DB userId별 이미지 경로 저장 
        await pool.query(`
            INSERT INTO profile_img (user_id, image_url)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE image_url = VALUES(image_url)
        `, [userId, s3Key]);
        res.json({ url, s3Key });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

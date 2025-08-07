# 프로젝트 폴더 구조

## controllers/
라우터별 요청 handler

## dtos/
API 요청 및 응답의 데이터 구조

## middlewares/
공통 미들웨어(인증, 에러/로깅, 파일 업로드 등) 

## models/
DB 모델(ORM 스키마, 쿼리 정의 등)

## public/
프로필 이미지, 업로드 파일 등 정적 리소스 

## repositories/
DB 직접 접근 쿼리 로직(DAO/Repository) 

## routes/
API 엔드포인트별(express.Router) 경로를 정의 

## services/
주요 비즈니스 로직  

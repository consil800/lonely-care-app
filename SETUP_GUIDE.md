# 안심케어 앱 - Supabase 연동 완료 가이드

## 🎉 완료된 작업

### 1. Supabase 데이터베이스 연동 완료
- ✅ 모든 하드코딩된 데이터 제거
- ✅ 실시간 데이터베이스 연동
- ✅ 사용자 인증 및 프로필 관리
- ✅ 친구 관리 시스템
- ✅ 알림 시스템
- ✅ 광고 배너 관리
- ✅ 관리자 페이지 완전 연동

### 2. 새로 생성된 파일들
- `supabase-config.js` - Supabase 설정
- `supabase-db.js` - 데이터베이스 관리 클래스
- `app-supabase.js` - Supabase 연동 메인 앱
- `admin-supabase.js` - 관리자 페이지 DB 연동
- `SUPABASE_SETUP.md` - 상세 설정 가이드

## 🚀 설정 방법

### 1단계: Supabase 프로젝트 생성
1. [Supabase](https://supabase.com) 접속 후 회원가입
2. "New Project" 생성
3. 프로젝트 이름: `lonely-care-app`
4. 리전: `Northeast Asia (Seoul)` 선택

### 2단계: 데이터베이스 스키마 생성
1. Supabase 대시보드에서 "SQL Editor" 접속
2. `SUPABASE_SETUP.md`의 SQL 스크립트 전체 복사 후 실행

### 3단계: API 키 설정
1. Supabase 대시보드에서 "Settings" > "API" 접속
2. `supabase-config.js` 파일 수정:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const SUPABASE_SERVICE_KEY = 'your-service-key'; // 관리자용
```

### 4단계: 카카오 로그인 연동 (선택사항)
1. [카카오 개발자 사이트](https://developers.kakao.com)에서 앱 등록
2. `app-supabase.js`의 `KAKAO_JS_KEY` 수정
3. Supabase Authentication > Providers에서 Kakao 설정

## 📱 앱 기능

### 사용자 앱 (index.html)
- **카카오 로그인**: 간편한 소셜 로그인
- **친구 관리**: 이메일로 친구 추가/삭제
- **실시간 상태 모니터링**: 24/48/72시간 무응답 감지
- **자동 알림**: 단계별 위험 상황 알림
- **프로필 관리**: 응급시 필요한 개인정보 등록
- **광고 시스템**: 카테고리별 광고 배너
- **알림 설정**: 개인별 알림 선호도 설정

### 관리자 페이지 (admin.html)
- **실시간 대시보드**: 사용자/활동/알림 통계
- **사용자 관리**: 전체 사용자 현황 및 상태 모니터링
- **알림 관리**: 미해결 알림 처리 및 시스템 알림 발송
- **광고 관리**: 광고 배너 추가/수정/삭제
- **시스템 관리**: 상태 점검, 데이터 정리, 응급 보고서

## 🗄️ 데이터베이스 구조

### 주요 테이블
- `users`: 사용자 정보
- `friends`: 친구 관계
- `user_activities`: 사용자 활동 기록
- `notifications`: 알림 내역
- `ad_banners`: 광고 배너
- `notification_settings`: 알림 설정

### 보안 정책 (RLS)
- 사용자는 자신의 데이터만 조회/수정 가능
- 친구 관계는 양방향 조회 허용
- 관리자는 service key로 모든 데이터 접근

## 🔧 개발 환경 실행

### 로컬 서버 실행
```bash
# Python 서버
python -m http.server 8000

# Node.js 서버 (http-server 설치 필요)
npx http-server -p 8000

# VS Code Live Server 확장 사용
```

### 접속 주소
- 사용자 앱: `http://localhost:8000/index.html`
- 관리자 페이지: `http://localhost:8000/admin.html`

## 📋 주요 변경사항

### 하드코딩 제거
- ❌ 로컬 스토리지 기반 더미 데이터
- ❌ 하드코딩된 사용자 목록
- ❌ 정적 알림 데이터
- ❌ 고정된 광고 배너

### 데이터베이스 연동
- ✅ 실시간 사용자 데이터
- ✅ 동적 친구 관계 관리
- ✅ 자동 알림 생성/관리
- ✅ 관리자 기반 광고 관리

## 🚨 주의사항

1. **API 키 보안**: 
   - Service Key는 관리자 페이지에서만 사용
   - 실제 배포시 환경 변수 사용 권장

2. **RLS 정책**: 
   - 사용자 데이터 보안을 위한 Row Level Security 적용
   - 정책 수정시 신중하게 진행

3. **백업**: 
   - 정기적인 데이터베이스 백업 필수
   - Supabase 대시보드에서 자동 백업 설정

## 🔄 업데이트 및 유지보수

### 데이터 모니터링
- 관리자 페이지에서 실시간 통계 확인
- 응급 상황 보고서로 위험 사용자 파악
- 시스템 상태 점검으로 성능 모니터링

### 기능 확장
- 새로운 알림 유형 추가시 `notifications` 테이블 확장
- 광고 카테고리 추가시 `ad_banners` 테이블 업데이트
- 사용자 정보 항목 추가시 `users` 테이블 컬럼 추가

이제 안심케어 앱이 완전한 데이터베이스 기반 시스템으로 동작합니다! 🎊
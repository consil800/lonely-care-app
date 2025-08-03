# API 설계서 - 안심케어 고독사 방지 앱

## 📋 개요
안심케어 앱의 RESTful API 설계서입니다. 현재는 로컬 스토리지를 사용하지만, 향후 백엔드 서버 구축 시 이 API 설계를 따라 개발할 예정입니다.

## 🔗 Base URL
```
Production: https://api.ansimncare.com/v1
Development: http://localhost:3000/api/v1
```

## 🔐 인증
- **방식**: JWT (JSON Web Token)
- **헤더**: `Authorization: Bearer <token>`
- **토큰 만료**: 24시간

## 📚 API 엔드포인트

### 🔑 인증 관련

#### 회원가입
```http
POST /auth/register
Content-Type: application/json

{
  "name": "김철수",
  "email": "test@test.com",
  "password": "123456",
  "phone": "010-1234-5678",
  "address": "서울시 강남구 테헤란로 123",
  "detailAddress": "456호",
  "profilePic": "base64_image_data"
}
```

**응답**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "user": {
      "id": 1,
      "name": "김철수",
      "email": "test@test.com",
      "phone": "010-1234-5678",
      "joinDate": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### 로그인
```http
POST /auth/login
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "123456"
}
```

**응답**
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "김철수",
      "email": "test@test.com",
      "phone": "010-1234-5678"
    }
  }
}
```

#### 로그아웃
```http
POST /auth/logout
Authorization: Bearer <token>
```

### 👥 친구 관리

#### 친구 목록 조회
```http
GET /friends
Authorization: Bearer <token>
```

**응답**
```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "id": 2,
        "name": "이영희",
        "email": "friend1@test.com",
        "phone": "010-2345-6789",
        "address": "서울시 서초구 서초대로 789",
        "addedDate": "2024-01-10T15:20:00Z",
        "status": "active"
      }
    ]
  }
}
```

#### 카카오톡 친구 연동
```http
GET /friends/kakao
Authorization: Bearer <token>
```

**응답**
```json
{
  "success": true,
  "data": {
    "kakaoFriends": [
      {
        "id": "kakao1",
        "name": "김민지",
        "status": "available",
        "profileImage": "https://kakao.com/profile/kakao1.jpg"
      }
    ]
  }
}
```

#### 카카오톡 친구 초대
```http
POST /friends/kakao/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "kakaoFriendId": "kakao1",
  "friendName": "김민지"
}
```

#### 친구 연결 해지 (일시 중단)
```http
PUT /friends/{friendId}/disconnect
Authorization: Bearer <token>
```

#### 친구 완전 삭제
```http
DELETE /friends/{friendId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "deleteType": "permanent",
  "deleteActivityData": true
}
```

### 📊 친구 상태 관리

#### 친구 상태 조회
```http
GET /friends/status
Authorization: Bearer <token>
```

**응답**
```json
{
  "success": true,
  "data": {
    "friendsStatus": [
      {
        "friendId": 2,
        "name": "이영희",
        "status": "active",
        "lastActivity": "2024-01-15T14:30:00Z",
        "hoursSinceActivity": 12
      }
    ]
  }
}
```

#### 사용자 활동 기록
```http
POST /activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "activityType": "heartbeat",
  "activityData": {
    "location": "home",
    "deviceInfo": "mobile"
  }
}
```

### 🔔 알림 관리

#### 알림 목록 조회
```http
GET /notifications?page=1&limit=10
Authorization: Bearer <token>
```

**응답**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "warning",
        "title": "친구 상태 확인",
        "message": "이영희님이 24시간 동안 응답하지 않습니다.",
        "isRead": false,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 25
    }
  }
}
```

#### 알림 읽음 처리
```http
PUT /notifications/{notificationId}/read
Authorization: Bearer <token>
```

#### 알림 설정 조회
```http
GET /notifications/settings
Authorization: Bearer <token>
```

#### 알림 설정 업데이트
```http
PUT /notifications/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "pushNotifications": true,
  "friendNotifications": true,
  "emergencyNotifications": true,
  "criticalNotifications": true,
  "emergencyCallNotifications": true,
  "notificationHoursStart": "09:00",
  "notificationHoursEnd": "22:00"
}
```

### 👤 프로필 관리

#### 프로필 조회
```http
GET /profile
Authorization: Bearer <token>
```

#### 프로필 업데이트
```http
PUT /profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "김철수",
  "phone": "010-1234-5678",
  "address": "서울시 강남구 테헤란로 123",
  "detailAddress": "456호"
}
```

#### 프로필 사진 업로드
```http
POST /profile/photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

photo: <file>
```

### 📢 광고 배너

#### 광고 배너 조회
```http
GET /ads?category=insurance
```

**응답**
```json
{
  "success": true,
  "data": {
    "ads": [
      {
        "id": 1,
        "category": "insurance",
        "title": "건강보험",
        "content": "든든한 건강 보장, 지금 가입하세요!",
        "imageUrl": "https://cdn.example.com/insurance1.jpg",
        "linkUrl": "https://insurance.example.com"
      }
    ]
  }
}
```

### 🛠️ 관리자 API

#### 통계 조회
```http
GET /admin/stats
Authorization: Bearer <admin_token>
```

**응답**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 98,
    "totalConnections": 320,
    "emergencyAlerts": 5,
    "dailyStats": [
      {
        "date": "2024-01-15",
        "newUsers": 5,
        "activeUsers": 98,
        "alerts": 2
      }
    ]
  }
}
```

#### 광고 배너 추가
```http
POST /admin/ads
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "category": "insurance",
  "title": "새로운 보험 상품",
  "content": "특별 혜택으로 가입하세요!",
  "imageUrl": "https://cdn.example.com/new-insurance.jpg",
  "linkUrl": "https://insurance.example.com/new",
  "startDate": "2024-01-20",
  "endDate": "2024-02-20"
}
```

#### 비상 연락처 관리
```http
GET /admin/emergency-contacts
POST /admin/emergency-contacts
PUT /admin/emergency-contacts/{contactId}
DELETE /admin/emergency-contacts/{contactId}
Authorization: Bearer <admin_token>
```

## 🚨 긴급 상황 API

#### 긴급 알림 발송
```http
POST /emergency/alert
Authorization: Bearer <token>
Content-Type: application/json

{
  "friendId": 2,
  "alertType": "critical",
  "message": "72시간 동안 응답 없음"
}
```

#### 공공기관 알림
```http
POST /emergency/notify-authorities
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 2,
  "alertType": "critical",
  "userInfo": {
    "name": "이영희",
    "phone": "010-2345-6789",
    "address": "서울시 서초구 서초대로 789"
  },
  "contacts": ["소방서(119)", "경찰서(112)", "관할 행정복지센터"]
}
```

## 📱 실시간 통신 (WebSocket)

### 연결
```javascript
const socket = new WebSocket('/ws');
socket.send(JSON.stringify({
  type: 'auth',
  token: 'jwt_token_here'
}));
```

### 실시간 이벤트
```javascript
// 친구 상태 변경
{
  "type": "friend_status_change",
  "data": {
    "friendId": 2,
    "status": "inactive",
    "timestamp": "2024-01-15T16:00:00Z"
  }
}

// 긴급 알림
{
  "type": "emergency_alert",
  "data": {
    "alertType": "critical",
    "friendName": "이영희",
    "message": "72시간 동안 응답하지 않습니다"
  }
}

// 하트비트
{
  "type": "heartbeat",
  "timestamp": "2024-01-15T16:00:00Z"
}
```

## 🔄 에러 처리

### 표준 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 올바르지 않습니다.",
    "details": {
      "email": "이메일 형식이 올바르지 않습니다.",
      "password": "비밀번호는 최소 6자 이상이어야 합니다."
    }
  }
}
```

### HTTP 상태 코드
- `200` - 성공
- `201` - 생성 성공
- `400` - 잘못된 요청
- `401` - 인증 실패
- `403` - 권한 없음
- `404` - 리소스 없음
- `409` - 중복 데이터
- `422` - 유효성 검사 실패
- `500` - 서버 에러

## 🔒 보안 고려사항

### 1. 인증 & 인가
- JWT 토큰 사용
- 토큰 만료 시간 관리
- Refresh Token 구현

### 2. 데이터 검증
- 입력 데이터 Validation
- SQL Injection 방지
- XSS 방지

### 3. 개인정보 보호
- 비밀번호 암호화 (bcrypt)
- 개인정보 암호화 저장
- GDPR 준수

### 4. API 제한
- Rate Limiting
- API 키 관리
- CORS 설정

## 📊 모니터링 & 로깅

### 로그 레벨
- `ERROR` - 시스템 오류
- `WARN` - 경고 상황
- `INFO` - 일반 정보
- `DEBUG` - 디버그 정보

### 메트릭스
- API 응답 시간
- 에러율
- 활성 사용자 수
- 알림 발송률

## 🚀 배포 환경

### Development
- URL: `http://localhost:3000`
- Database: SQLite
- Cache: Memory

### Staging
- URL: `https://staging-api.ansimncare.com`
- Database: MySQL
- Cache: Redis

### Production
- URL: `https://api.ansimncare.com`
- Database: MySQL (Master-Slave)
- Cache: Redis Cluster
- CDN: CloudFront

---
**© 2025 안심케어 API 설계서**
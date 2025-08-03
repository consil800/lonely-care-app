# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub으로 로그인
4. "New Project" 클릭
5. 프로젝트 정보 입력:
   - Name: lonely-care-app
   - Database Password: 강력한 비밀번호 설정
   - Region: Northeast Asia (Seoul)

## 2. 데이터베이스 스키마

```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  detail_address TEXT,
  profile_pic TEXT,
  kakao_id TEXT UNIQUE,
  is_kakao_user BOOLEAN DEFAULT FALSE,
  birth DATE,
  gender TEXT,
  blood_type TEXT,
  medical_conditions TEXT,
  allergies TEXT,
  workplace TEXT,
  emergency_contact1 TEXT,
  emergency_name1 TEXT,
  emergency_contact2 TEXT,
  emergency_name2 TEXT,
  special_notes TEXT,
  postal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 친구 관계 테이블
CREATE TABLE friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- active, pending, blocked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, friend_id)
);

-- 사용자 활동 기록 테이블
CREATE TABLE user_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  activity_type TEXT DEFAULT 'check_in' -- check_in, message, app_open
);

-- 알림 테이블
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- warning, severe, critical, emergency
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 광고 배너 테이블
CREATE TABLE ad_banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL, -- insurance, funeral, lawyer
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 관리자 테이블
CREATE TABLE admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin', -- admin, super_admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 알림 설정 테이블
CREATE TABLE notification_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  push_notifications BOOLEAN DEFAULT TRUE,
  friend_notifications BOOLEAN DEFAULT TRUE,
  emergency_notifications BOOLEAN DEFAULT TRUE,
  critical_notifications BOOLEAN DEFAULT TRUE,
  emergency_call_notifications BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Row Level Security (RLS) 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 볼 수 있음
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 친구 관계는 양방향 조회 가능
CREATE POLICY "Users can view friends" ON friends
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- 활동 기록은 본인과 친구만 조회 가능
CREATE POLICY "Users can view activities" ON user_activities
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friends 
      WHERE (friends.user_id = auth.uid() AND friends.friend_id = user_activities.user_id)
         OR (friends.friend_id = auth.uid() AND friends.user_id = user_activities.user_id)
    )
  );

-- 인덱스 생성
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_time ON user_activities(activity_time);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
```

## 3. Supabase 키 확인

1. 프로젝트 설정 > API
2. 다음 정보 복사:
   - Project URL
   - anon/public key
   - service_role key (관리자용)

## 4. 환경 변수 설정

```javascript
// supabase-config.js
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
const SUPABASE_SERVICE_KEY = 'your-service-key'; // 관리자 페이지용
```

## 5. Authentication 설정

1. Authentication > Providers
2. Email 활성화
3. Kakao OAuth 설정:
   - Provider: Kakao
   - Client ID: REST API 키
   - Client Secret: (카카오 개발자 사이트에서 발급)
   - Redirect URL 복사하여 카카오 개발자 사이트에 등록

## 6. Storage 설정 (프로필 이미지용)

1. Storage > New bucket
2. Bucket name: profiles
3. Public bucket 체크
4. 정책 설정:

```sql
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);
```
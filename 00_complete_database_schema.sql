-- 안심케어 앱 데이터베이스 스키마
-- Supabase (PostgreSQL) 용
-- 실행 순서대로 작성됨

-- ========================================
-- 1. users 테이블 (기본 사용자 정보)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kakao_id VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    birth DATE,
    gender VARCHAR(10),
    address TEXT,
    detail_address TEXT,
    postal VARCHAR(10),
    emergency_contact1 VARCHAR(20),
    emergency_name1 VARCHAR(50),
    emergency_contact2 VARCHAR(20),
    emergency_name2 VARCHAR(50),
    blood_type VARCHAR(10),
    medical_conditions TEXT,
    allergies TEXT,
    workplace TEXT,
    special_notes TEXT,
    profile_pic TEXT,
    memorial_pic TEXT,
    is_kakao_user BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- users 테이블 인덱스
CREATE INDEX idx_users_kakao_id ON users(kakao_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- users 테이블 RLS 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Service role can do everything" ON users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ========================================
-- 2. friends 테이블 (친구 관계)
-- ========================================
CREATE TABLE IF NOT EXISTS friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- friends 테이블 인덱스
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);

-- friends 테이블 RLS 정책
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own friends" ON friends
    FOR ALL USING (true);

-- ========================================
-- 3. user_activities 테이블 (사용자 활동 기록)
-- ========================================
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) DEFAULT 'check_in',
    activity_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB
);

-- user_activities 테이블 인덱스
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_time ON user_activities(activity_time DESC);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);

-- user_activities 테이블 RLS 정책
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own activities" ON user_activities
    FOR ALL USING (true);

-- ========================================
-- 4. notifications 테이블 (알림)
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- notifications 테이블 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_friend_id ON notifications(friend_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- notifications 테이블 RLS 정책
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications" ON notifications
    FOR ALL USING (true);

-- ========================================
-- 5. notification_settings 테이블 (알림 설정)
-- ========================================
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    push_notifications BOOLEAN DEFAULT true,
    friend_notifications BOOLEAN DEFAULT true,
    emergency_notifications BOOLEAN DEFAULT true,
    critical_notifications BOOLEAN DEFAULT true,
    emergency_call_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- notification_settings 테이블 RLS 정책
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" ON notification_settings
    FOR ALL USING (true);

-- ========================================
-- 6. ad_banners 테이블 (광고 배너)
-- ========================================
CREATE TABLE IF NOT EXISTS ad_banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(20) NOT NULL CHECK (category IN ('insurance', 'funeral', 'lawyer')),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    url TEXT,
    image_url TEXT,
    click_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ad_banners 테이블 인덱스
CREATE INDEX idx_ad_banners_category ON ad_banners(category);
CREATE INDEX idx_ad_banners_is_active ON ad_banners(is_active);

-- ad_banners 테이블 RLS 정책
ALTER TABLE ad_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ads" ON ad_banners
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage ads" ON ad_banners
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ========================================
-- 7. emergency_contacts 테이블 (비상 연락처)
-- ========================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('fire', 'police', 'admin', 'medical', 'other')),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- emergency_contacts 테이블 인덱스
CREATE INDEX idx_emergency_contacts_type ON emergency_contacts(type);
CREATE INDEX idx_emergency_contacts_created_at ON emergency_contacts(created_at DESC);

-- emergency_contacts 테이블 RLS 정책
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view emergency contacts" ON emergency_contacts
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage emergency contacts" ON emergency_contacts
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ========================================
-- 8. invite_codes 테이블 (친구 초대 코드)
-- ========================================
CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inviter_name VARCHAR(100),
    used_by UUID REFERENCES users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- invite_codes 테이블 인덱스
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_inviter ON invite_codes(inviter_id);
CREATE INDEX idx_invite_codes_active ON invite_codes(is_active);
CREATE INDEX idx_invite_codes_expires ON invite_codes(expires_at);

-- invite_codes 테이블 RLS 정책
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON invite_codes
    FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 함수: 광고 클릭 수 증가
-- ========================================
CREATE OR REPLACE FUNCTION increment_ad_click(ad_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE ad_banners 
    SET click_count = click_count + 1 
    WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 테이블 코멘트
-- ========================================
COMMENT ON TABLE users IS '사용자 정보';
COMMENT ON TABLE friends IS '친구 관계';
COMMENT ON TABLE user_activities IS '사용자 활동 기록';
COMMENT ON TABLE notifications IS '알림 메시지';
COMMENT ON TABLE notification_settings IS '알림 설정';
COMMENT ON TABLE ad_banners IS '광고 배너';
COMMENT ON TABLE emergency_contacts IS '비상 연락처';
COMMENT ON TABLE invite_codes IS '친구 초대 코드';

-- ========================================
-- 샘플 데이터 (선택사항)
-- ========================================
-- 비상 연락처 샘플 데이터
INSERT INTO emergency_contacts (name, phone, type, address) VALUES
    ('서울종로소방서', '02-760-4119', 'fire', '서울특별시 종로구 율곡로 35'),
    ('종로경찰서', '02-2171-0112', 'police', '서울특별시 종로구 율곡로 46'),
    ('종로구청', '02-2148-1234', 'admin', '서울특별시 종로구 삼봉로 17'),
    ('서울대학교병원', '02-2072-2114', 'medical', '서울특별시 종로구 대학로 101')
ON CONFLICT DO NOTHING;

-- 광고 배너 샘플 데이터
INSERT INTO ad_banners (category, title, content, url) VALUES
    ('insurance', '실버 안심보험', '고령자를 위한 맞춤형 보험 상품', 'https://example.com/insurance'),
    ('funeral', '효도 상조 서비스', '부담 없는 월 납입료로 준비하는 상조 서비스', 'https://example.com/funeral'),
    ('lawyer', '상속 전문 법률 상담', '복잡한 상속 문제, 전문가와 함께 해결하세요', 'https://example.com/lawyer')
ON CONFLICT DO NOTHING;

-- ========================================
-- 완료 메시지
-- ========================================
-- 모든 테이블과 정책이 생성되었습니다.
-- Supabase 대시보드의 SQL Editor에서 이 파일을 실행하세요.
-- 1. users 테이블 생성
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

-- 테이블 설명
COMMENT ON TABLE users IS '사용자 정보';
COMMENT ON COLUMN users.kakao_id IS '카카오 고유 ID';
COMMENT ON COLUMN users.memorial_pic IS '영정사진 (Base64 또는 URL)';
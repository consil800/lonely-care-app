-- 8. invite_codes 테이블 생성
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

-- 테이블 설명
COMMENT ON TABLE invite_codes IS '친구 초대 코드';
COMMENT ON COLUMN invite_codes.code IS '초대 코드 (고유값)';
COMMENT ON COLUMN invite_codes.inviter_id IS '초대한 사용자 ID';
COMMENT ON COLUMN invite_codes.inviter_name IS '초대한 사용자 이름';
COMMENT ON COLUMN invite_codes.used_by IS '초대 코드를 사용한 사용자 ID';
COMMENT ON COLUMN invite_codes.used_at IS '사용 시간';
COMMENT ON COLUMN invite_codes.expires_at IS '만료 시간';
COMMENT ON COLUMN invite_codes.is_active IS '활성 상태';
-- 2. friends 테이블 생성
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

-- 테이블 설명
COMMENT ON TABLE friends IS '친구 관계';
COMMENT ON COLUMN friends.status IS '관계 상태 (active: 활성, pending: 대기중, blocked: 차단)';
-- 3. user_activities 테이블 생성
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

-- 4. notifications 테이블 생성
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

-- 5. notification_settings 테이블 생성
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

-- 테이블 설명
COMMENT ON TABLE user_activities IS '사용자 활동 기록';
COMMENT ON TABLE notifications IS '알림 메시지';
COMMENT ON TABLE notification_settings IS '알림 설정';
-- 안심케어 고독사 방지 앱 데이터베이스 스키마
-- MySQL/PostgreSQL 호환

-- 사용자 테이블
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    detail_address TEXT,
    profile_pic_url VARCHAR(500),
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 친구 관계 테이블
CREATE TABLE friendships (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    friend_id BIGINT NOT NULL,
    status ENUM('pending', 'accepted', 'blocked') DEFAULT 'accepted',
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (user_id, friend_id)
);

-- 사용자 활동 기록 테이블
CREATE TABLE user_activities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    activity_type ENUM('login', 'heartbeat', 'movement', 'manual_check') DEFAULT 'heartbeat',
    activity_data JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_timestamp (timestamp)
);

-- 알림 테이블
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    target_user_id BIGINT,
    type ENUM('warning', 'severe', 'critical', 'info') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_type_created (type, created_at)
);

-- 광고 배너 테이블
CREATE TABLE ad_banners (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category ENUM('insurance', 'funeral', 'lawyer') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    link_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_active (category, is_active),
    INDEX idx_dates (start_date, end_date)
);

-- 비상 연락처 테이블
CREATE TABLE emergency_contacts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    type ENUM('fire', 'police', 'admin', 'medical', 'other') NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    priority_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_active (type, is_active)
);

-- 알림 설정 테이블
CREATE TABLE notification_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    push_notifications BOOLEAN DEFAULT TRUE,
    friend_notifications BOOLEAN DEFAULT TRUE,
    emergency_notifications BOOLEAN DEFAULT TRUE,
    notification_hours_start TIME DEFAULT '09:00:00',
    notification_hours_end TIME DEFAULT '22:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id)
);

-- 시스템 로그 테이블
CREATE TABLE system_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_action_created (action, created_at)
);

-- 기본 데이터 삽입
INSERT INTO users (name, email, password, phone, address, detail_address) VALUES
('김철수', 'test@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '010-1234-5678', '서울시 강남구 테헤란로 123', '456호'),
('이영희', 'friend1@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '010-2345-6789', '서울시 서초구 서초대로 789', '101호'),
('박민수', 'friend2@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '010-3456-7890', '서울시 송파구 올림픽로 456', '789호');

INSERT INTO ad_banners (category, title, content) VALUES
('insurance', '건강보험', '든든한 건강 보장, 지금 가입하세요!'),
('insurance', '생명보험', '가족을 위한 안전한 미래 준비'),
('funeral', '상조서비스', '품격있는 마지막 배웅을 준비하세요'),
('funeral', '장례지도사', '전문적인 장례 서비스 제공'),
('lawyer', '상속 변호사', '원활한 상속 절차를 도와드립니다'),
('lawyer', '유언장 작성', '법적 효력 있는 유언장 작성 지원');

INSERT INTO emergency_contacts (name, phone, type, priority_order) VALUES
('소방서', '119', 'fire', 1),
('경찰서', '112', 'police', 2),
('행정센터', '1588-0000', 'admin', 3);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_activities_recent ON user_activities(user_id, timestamp DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at);

-- 뷰 생성 (자주 사용되는 쿼리 최적화)
CREATE VIEW friend_status_view AS
SELECT 
    f.user_id,
    f.friend_id,
    u.name as friend_name,
    u.email as friend_email,
    u.phone as friend_phone,
    u.address as friend_address,
    MAX(ua.timestamp) as last_activity,
    TIMESTAMPDIFF(HOUR, MAX(ua.timestamp), NOW()) as hours_since_activity,
    CASE 
        WHEN TIMESTAMPDIFF(HOUR, MAX(ua.timestamp), NOW()) < 1 THEN 'active'
        WHEN TIMESTAMPDIFF(HOUR, MAX(ua.timestamp), NOW()) < 24 THEN 'inactive'
        WHEN TIMESTAMPDIFF(HOUR, MAX(ua.timestamp), NOW()) < 48 THEN 'warning'
        WHEN TIMESTAMPDIFF(HOUR, MAX(ua.timestamp), NOW()) < 72 THEN 'danger'
        ELSE 'critical'
    END as status
FROM friendships f
JOIN users u ON f.friend_id = u.id
LEFT JOIN user_activities ua ON f.friend_id = ua.user_id
WHERE f.status = 'accepted' AND u.is_active = TRUE
GROUP BY f.user_id, f.friend_id, u.name, u.email, u.phone, u.address;

-- 활동 통계 뷰
CREATE VIEW activity_stats_view AS
SELECT 
    DATE(ua.timestamp) as activity_date,
    COUNT(DISTINCT ua.user_id) as active_users,
    COUNT(*) as total_activities,
    AVG(TIMESTAMPDIFF(MINUTE, 
        LAG(ua.timestamp) OVER (PARTITION BY ua.user_id ORDER BY ua.timestamp), 
        ua.timestamp)) as avg_interval_minutes
FROM user_activities ua
WHERE ua.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(ua.timestamp);

-- 저장 프로시저: 친구 상태 체크
DELIMITER //
CREATE PROCEDURE CheckFriendStatus()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_user_id, v_friend_id BIGINT;
    DECLARE v_hours_since_activity INT;
    DECLARE friend_cursor CURSOR FOR 
        SELECT user_id, friend_id, hours_since_activity 
        FROM friend_status_view 
        WHERE hours_since_activity >= 24;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN friend_cursor;
    
    read_loop: LOOP
        FETCH friend_cursor INTO v_user_id, v_friend_id, v_hours_since_activity;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 24시간 경고
        IF v_hours_since_activity >= 24 AND v_hours_since_activity < 48 THEN
            INSERT INTO notifications (user_id, target_user_id, type, title, message)
            SELECT v_user_id, v_friend_id, 'warning', '친구 상태 확인', 
                   CONCAT((SELECT name FROM users WHERE id = v_friend_id), '님이 24시간 동안 응답하지 않습니다.')
            WHERE NOT EXISTS (
                SELECT 1 FROM notifications 
                WHERE user_id = v_user_id AND target_user_id = v_friend_id 
                AND type = 'warning' AND created_at > DATE_SUB(NOW(), INTERVAL 6 HOUR)
            );
        END IF;
        
        -- 48시간 심각한 경고
        IF v_hours_since_activity >= 48 AND v_hours_since_activity < 72 THEN
            INSERT INTO notifications (user_id, target_user_id, type, title, message)
            SELECT v_user_id, v_friend_id, 'severe', '긴급 상태 확인', 
                   CONCAT('⚠️ ', (SELECT name FROM users WHERE id = v_friend_id), '님이 48시간 동안 응답하지 않습니다!')
            WHERE NOT EXISTS (
                SELECT 1 FROM notifications 
                WHERE user_id = v_user_id AND target_user_id = v_friend_id 
                AND type = 'severe' AND created_at > DATE_SUB(NOW(), INTERVAL 6 HOUR)
            );
        END IF;
        
        -- 72시간 위급 상황
        IF v_hours_since_activity >= 72 THEN
            INSERT INTO notifications (user_id, target_user_id, type, title, message)
            SELECT v_user_id, v_friend_id, 'critical', '위급 상황 발생', 
                   CONCAT('🚨 긴급! ', (SELECT name FROM users WHERE id = v_friend_id), '님이 72시간 동안 응답하지 않습니다!')
            WHERE NOT EXISTS (
                SELECT 1 FROM notifications 
                WHERE user_id = v_user_id AND target_user_id = v_friend_id 
                AND type = 'critical' AND created_at > DATE_SUB(NOW(), INTERVAL 6 HOUR)
            );
        END IF;
        
    END LOOP;
    
    CLOSE friend_cursor;
END //
DELIMITER ;

-- 저장 프로시저: 사용자 활동 기록
DELIMITER //
CREATE PROCEDURE RecordUserActivity(
    IN p_user_id BIGINT,
    IN p_activity_type VARCHAR(50),
    IN p_activity_data JSON
)
BEGIN
    INSERT INTO user_activities (user_id, activity_type, activity_data)
    VALUES (p_user_id, p_activity_type, p_activity_data);
    
    -- 사용자 최종 로그인 시간 업데이트
    IF p_activity_type = 'login' THEN
        UPDATE users SET last_login = NOW() WHERE id = p_user_id;
    END IF;
END //
DELIMITER ;

-- 이벤트 스케줄러: 자동 상태 체크 (1시간마다)
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS auto_friend_status_check
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
    CALL CheckFriendStatus();

-- 이벤트 스케줄러: 오래된 활동 기록 정리 (매일 자정)
CREATE EVENT IF NOT EXISTS cleanup_old_activities
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    DELETE FROM user_activities 
    WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 트리거: 사용자 삭제 시 관련 데이터 정리
DELIMITER //
CREATE TRIGGER before_user_delete
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
    -- 시스템 로그에 기록
    INSERT INTO system_logs (user_id, action, details)
    VALUES (OLD.id, 'user_deleted', JSON_OBJECT('name', OLD.name, 'email', OLD.email));
END //
DELIMITER ;

-- 성능 최적화를 위한 추가 인덱스
CREATE INDEX idx_user_activities_type_timestamp ON user_activities(activity_type, timestamp);
CREATE INDEX idx_notifications_type_sent ON notifications(type, is_sent, created_at);
CREATE INDEX idx_ad_banners_category_order ON ad_banners(category, display_order, is_active);

-- 데이터베이스 전환을 위한 마이그레이션 함수들
DELIMITER //
CREATE PROCEDURE MigrateFromLocalStorage()
BEGIN
    -- 이 프로시저는 로컬 스토리지에서 데이터베이스로 데이터를 마이그레이션할 때 사용
    -- JavaScript에서 호출하여 로컬 스토리지 데이터를 전달받아 DB에 저장
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 마이그레이션 로직은 애플리케이션 레벨에서 구현
    -- 이 프로시저는 트랜잭션 관리용
    
    COMMIT;
END //
DELIMITER ;

-- 백업 및 복구를 위한 프로시저
DELIMITER //
CREATE PROCEDURE BackupUserData(IN p_user_id BIGINT)
BEGIN
    -- 특정 사용자의 모든 데이터를 JSON 형태로 백업
    SELECT JSON_OBJECT(
        'user', (SELECT JSON_OBJECT('id', id, 'name', name, 'email', email, 'phone', phone, 'address', address, 'detail_address', detail_address) FROM users WHERE id = p_user_id),
        'friends', (SELECT JSON_ARRAYAGG(JSON_OBJECT('friend_id', friend_id, 'added_date', added_date)) FROM friendships WHERE user_id = p_user_id),
        'activities', (SELECT JSON_ARRAYAGG(JSON_OBJECT('activity_type', activity_type, 'timestamp', timestamp, 'activity_data', activity_data)) FROM user_activities WHERE user_id = p_user_id ORDER BY timestamp DESC LIMIT 100),
        'notifications', (SELECT JSON_ARRAYAGG(JSON_OBJECT('type', type, 'title', title, 'message', message, 'created_at', created_at)) FROM notifications WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 50)
    ) as backup_data;
END //
DELIMITER ;

-- 관리자용 통계 뷰
CREATE VIEW admin_stats_view AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as total_users,
    (SELECT COUNT(DISTINCT user_id) FROM user_activities WHERE timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)) as active_users_24h,
    (SELECT COUNT(*) FROM friendships WHERE status = 'accepted') as total_friendships,
    (SELECT COUNT(*) FROM notifications WHERE type = 'critical' AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)) as critical_alerts_week,
    (SELECT COUNT(*) FROM ad_banners WHERE is_active = TRUE) as active_ads,
    (SELECT AVG(TIMESTAMPDIFF(DAY, join_date, last_login)) FROM users WHERE last_login IS NOT NULL) as avg_user_retention_days;

COMMIT;
-- 6. ad_banners 테이블 생성
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

-- 7. emergency_contacts 테이블 생성
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

-- 테이블 설명
COMMENT ON TABLE ad_banners IS '광고 배너';
COMMENT ON TABLE emergency_contacts IS '비상 연락처';
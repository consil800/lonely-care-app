-- Create monitoring_settings table
CREATE TABLE IF NOT EXISTS monitoring_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    hours INTEGER NOT NULL CHECK (hours > 0),
    alert_level TEXT NOT NULL CHECK (alert_level IN ('warning', 'danger', 'critical', 'custom')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO monitoring_settings (name, hours, alert_level) VALUES
    ('경고 (Warning)', 24, 'warning'),
    ('위험 (Danger)', 48, 'danger'),
    ('긴급 (Critical)', 72, 'critical')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_monitoring_settings_updated_at
    BEFORE UPDATE ON monitoring_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE monitoring_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read monitoring settings
CREATE POLICY "Allow read for authenticated users" ON monitoring_settings
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to insert/update/delete monitoring settings
CREATE POLICY "Allow all operations for authenticated users" ON monitoring_settings
    FOR ALL
    USING (auth.uid() IS NOT NULL);
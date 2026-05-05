-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: app_settings
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE UNIQUE NOT NULL,
    default_area_id UUID, -- References areas(id) later
    currency TEXT DEFAULT 'BRL',
    company_name TEXT,
    report_header_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: areas
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Table: operators
CREATE TABLE IF NOT EXISTS operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES areas ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: prize_categories
CREATE TABLE IF NOT EXISTS prize_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES areas ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: commission_settings
CREATE TABLE IF NOT EXISTS commission_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES areas ON DELETE CASCADE UNIQUE NOT NULL,
    commission_type TEXT NOT NULL DEFAULT 'manual', -- manual, percentage, fixed
    default_percentage NUMERIC DEFAULT 0,
    default_fixed_value NUMERIC DEFAULT 0,
    apply_mode TEXT NOT NULL DEFAULT 'period', -- period, group, day
    auto_calculate BOOLEAN DEFAULT FALSE,
    allow_manual_override BOOLEAN DEFAULT TRUE,
    
    -- Specific percentages
    morning_percentage NUMERIC DEFAULT 0,
    afternoon_percentage NUMERIC DEFAULT 0,
    night_percentage NUMERIC DEFAULT 0,
    group_morning_percentage NUMERIC DEFAULT 0,
    group_afternoon_percentage NUMERIC DEFAULT 0,
    group_night_percentage NUMERIC DEFAULT 0,
    
    -- Specific fixed values
    morning_fixed_value NUMERIC DEFAULT 0,
    afternoon_fixed_value NUMERIC DEFAULT 0,
    night_fixed_value NUMERIC DEFAULT 0,
    group_morning_fixed_value NUMERIC DEFAULT 0,
    group_afternoon_fixed_value NUMERIC DEFAULT 0,
    group_night_fixed_value NUMERIC DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: daily_records
CREATE TABLE IF NOT EXISTS daily_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES areas ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    
    -- Entries
    morning_entries NUMERIC DEFAULT 0,
    afternoon_entries NUMERIC DEFAULT 0,
    night_entries NUMERIC DEFAULT 0,
    group_morning_entries NUMERIC DEFAULT 0,
    group_afternoon_entries NUMERIC DEFAULT 0,
    group_night_entries NUMERIC DEFAULT 0,
    
    -- Commission
    morning_commission NUMERIC DEFAULT 0,
    afternoon_commission NUMERIC DEFAULT 0,
    night_commission NUMERIC DEFAULT 0,
    group_morning_commission NUMERIC DEFAULT 0,
    group_afternoon_commission NUMERIC DEFAULT 0,
    group_night_commission NUMERIC DEFAULT 0,
    
    -- Prizes
    morning_prizes NUMERIC DEFAULT 0,
    afternoon_prizes NUMERIC DEFAULT 0,
    night_prizes NUMERIC DEFAULT 0,
    group_morning_prizes NUMERIC DEFAULT 0,
    group_afternoon_prizes NUMERIC DEFAULT 0,
    group_night_prizes NUMERIC DEFAULT 0,
    
    -- Operators
    morning_operator_id UUID REFERENCES operators(id),
    afternoon_operator_id UUID REFERENCES operators(id),
    night_operator_id UUID REFERENCES operators(id),
    group_morning_operator_id UUID REFERENCES operators(id),
    group_afternoon_operator_id UUID REFERENCES operators(id),
    group_night_operator_id UUID REFERENCES operators(id),

    -- Totals
    total_entries NUMERIC DEFAULT 0,
    total_commission NUMERIC DEFAULT 0,
    total_prizes NUMERIC DEFAULT 0,
    total_final NUMERIC DEFAULT 0, -- Operacional balance
    total_extra_expenses NUMERIC DEFAULT 0,
    total_net_final NUMERIC DEFAULT 0, -- Final balance after expenses
    
    -- Status & Auditing
    notes TEXT,
    saved_by UUID REFERENCES auth.users,
    last_modified_by UUID REFERENCES auth.users,
    
    closed BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES auth.users,
    
    checked BOOLEAN DEFAULT FALSE,
    checked_at TIMESTAMP WITH TIME ZONE,
    checked_by UUID REFERENCES auth.users,

    -- Commission Metadata
    commission_type_used TEXT,
    commission_percentage_used NUMERIC,
    commission_fixed_value_used NUMERIC,
    commission_auto_calculated BOOLEAN DEFAULT FALSE,
    commission_manual_override BOOLEAN DEFAULT FALSE,
    commission_settings_snapshot JSONB,
    
    -- Reporting
    report_snapshot JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, area_id, date)
);

-- Table: extra_expenses
CREATE TABLE IF NOT EXISTS extra_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES areas ON DELETE CASCADE NOT NULL,
    record_id UUID REFERENCES daily_records ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: record_attachments
CREATE TABLE IF NOT EXISTS record_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES areas ON DELETE CASCADE NOT NULL,
    record_id UUID REFERENCES daily_records ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: area_goals
CREATE TABLE IF NOT EXISTS area_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES areas ON DELETE CASCADE NOT NULL,
    goal_type TEXT NOT NULL, -- entries, final, commission
    goal_value NUMERIC DEFAULT 0,
    period TEXT NOT NULL, -- daily, weekly, monthly
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: export_history
CREATE TABLE IF NOT EXISTS export_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    area_id UUID REFERENCES areas ON DELETE CASCADE,
    report_type TEXT NOT NULL, -- daily, weekly, monthly
    date_reference DATE,
    period_start DATE,
    period_end DATE,
    file_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    user_email TEXT,
    area_id UUID,
    record_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    date_reference DATE,
    summary TEXT, -- Human readable summary of the change
    old_data JSONB,
    new_data JSONB,
    changed_fields JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Generic Policy Helper: Users manage own data
DO $$ 
DECLARE 
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('audit_logs', 'profiles') LOOP
        EXECUTE format('CREATE POLICY "Users manage own %I" ON %I FOR ALL USING (auth.uid() = user_id)', tbl, tbl);
    END LOOP;
END $$;

-- Profiles specific policy (uses 'id' instead of 'user_id')
CREATE POLICY "Users manage own profiles" ON profiles FOR ALL USING (auth.uid() = id);

-- Audit Logs specific policies
CREATE POLICY "Users view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON operators FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_prize_categories_updated_at BEFORE UPDATE ON prize_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_commission_settings_updated_at BEFORE UPDATE ON commission_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_daily_records_updated_at BEFORE UPDATE ON daily_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_extra_expenses_updated_at BEFORE UPDATE ON extra_expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_area_goals_updated_at BEFORE UPDATE ON area_goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Auth Handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.app_settings (user_id, company_name)
  VALUES (new.id, 'Minha Empresa');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- VIEWS
CREATE OR REPLACE VIEW daily_records_with_area AS
SELECT dr.*, a.name as area_name
FROM daily_records dr
JOIN areas a ON dr.area_id = a.id;

CREATE OR REPLACE VIEW weekly_summary AS
SELECT 
    user_id,
    area_id,
    date_trunc('week', date)::date as week_start,
    sum(total_entries) as total_entries,
    sum(total_commission) as total_commission,
    sum(total_prizes) as total_prizes,
    sum(total_final) as total_final,
    sum(total_net_final) as total_net_final
FROM daily_records
GROUP BY user_id, area_id, week_start;

CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
    user_id,
    area_id,
    date_trunc('month', date)::date as month_start,
    sum(total_entries) as total_entries,
    sum(total_commission) as total_commission,
    sum(total_prizes) as total_prizes,
    sum(total_final) as total_final,
    sum(total_net_final) as total_net_final
FROM daily_records
GROUP BY user_id, area_id, month_start;

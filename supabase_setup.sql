-- Qnnect Database Setup Script
-- Copy and paste this into your Supabase SQL Editor to create all necessary tables

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('hospital', 'clinic', 'restaurant')),
  description text DEFAULT '',
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  max_daily_capacity integer DEFAULT 100 CHECK (max_daily_capacity > 0),
  avg_service_time integer DEFAULT 15 CHECK (avg_service_time > 0),
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create queue_entries table
CREATE TABLE IF NOT EXISTS queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  queue_number integer NOT NULL,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'cancelled')),
  estimated_wait_time integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  called_at timestamptz,
  completed_at timestamptz,
  notes text DEFAULT ''
);

-- Create business_analytics table
CREATE TABLE IF NOT EXISTS business_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  total_served integer DEFAULT 0,
  total_cancelled integer DEFAULT 0,
  avg_wait_time integer DEFAULT 0,
  peak_hour integer DEFAULT 12,
  UNIQUE(business_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_businesses_type ON businesses(type);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_business ON queue_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_user ON queue_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_joined ON queue_entries(joined_at);
CREATE INDEX IF NOT EXISTS idx_analytics_business_date ON business_analytics(business_id, date);

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can insert their businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can update their businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can delete their businesses" ON businesses;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own queue entries" ON queue_entries;
DROP POLICY IF EXISTS "Business owners can view their queue entries" ON queue_entries;
DROP POLICY IF EXISTS "Authenticated users can join queues" ON queue_entries;
DROP POLICY IF EXISTS "Users can update own queue entries" ON queue_entries;
DROP POLICY IF EXISTS "Business owners can update their queue entries" ON queue_entries;

DROP POLICY IF EXISTS "Business owners can view their analytics" ON business_analytics;
DROP POLICY IF EXISTS "Business owners can insert their analytics" ON business_analytics;
DROP POLICY IF EXISTS "Business owners can update their analytics" ON business_analytics;

-- RLS Policies for businesses table
CREATE POLICY "Anyone can view businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Business owners can insert their businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Business owners can update their businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Business owners can delete their businesses"
  ON businesses FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for queue_entries table
CREATE POLICY "Users can view own queue entries"
  ON queue_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Business owners can view their queue entries"
  ON queue_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = queue_entries.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join queues"
  ON queue_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue entries"
  ON queue_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Business owners can update their queue entries"
  ON queue_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = queue_entries.business_id
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = queue_entries.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- RLS Policies for business_analytics table
CREATE POLICY "Business owners can view their analytics"
  ON business_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_analytics.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can insert their analytics"
  ON business_analytics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_analytics.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their analytics"
  ON business_analytics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_analytics.business_id
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_analytics.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

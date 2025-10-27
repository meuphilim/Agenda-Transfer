-- Consolidated Initial Schema
-- This script contains the complete database structure, consolidated from multiple migration files.
-- It is designed to be the single source of truth for creating a new database environment.

-- Drop existing objects in reverse order of creation to handle dependencies
DROP FUNCTION IF EXISTS public.upsert_package_with_activities(jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_availability_stats() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS private.sync_user_claims() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_claim(text) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_change_sync_claims ON public.profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

DROP TABLE IF EXISTS public.package_attractions CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.attractions CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.user_status;
DROP TYPE IF EXISTS public.availability_stats;

DROP SCHEMA IF EXISTS private;

-- 1. Schemas, Types, and Enums
CREATE SCHEMA IF NOT EXISTS private;

CREATE TYPE public.user_status AS ENUM ('pending', 'active', 'inactive');
CREATE TYPE public.availability_stats AS (
  available_drivers BIGINT,
  available_vehicles BIGINT
);

-- 2. Tables
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  cnpj text,
  address text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  estimated_duration integer DEFAULT 60,
  location text,
  active boolean DEFAULT true,
  valor_net DECIMAL(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON COLUMN public.attractions.valor_net IS 'Valor NET do atrativo para cálculo de fechamento';

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text NOT NULL UNIQUE,
  model text NOT NULL,
  brand text,
  capacity integer NOT NULL DEFAULT 1,
  status text DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  license_number text NOT NULL,
  license_expiry date,
  status text DEFAULT 'available' CHECK (status IN ('available', 'busy', 'unavailable')),
  active boolean DEFAULT true,
  category text NOT NULL DEFAULT 'B' CHECK (category IN ('A', 'B', 'C', 'D', 'E', 'AB')),
  ear boolean NOT NULL DEFAULT false,
  valor_diaria DECIMAL(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON COLUMN public.drivers.category IS 'Categoria da CNH do motorista (A, B, C, D, E, AB)';
COMMENT ON COLUMN public.drivers.ear IS 'Indica se o motorista possui EAR (Exerce Atividade Remunerada)';
COMMENT ON COLUMN public.drivers.valor_diaria IS 'Valor da diária pago ao motorista';

CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE, -- Made nullable for "Venda Direta"
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_participants integer DEFAULT 1,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes text,
  client_name text,
  considerar_diaria_motorista boolean DEFAULT false NOT NULL,
  valor_diaria_servico numeric(10,2), -- Missing column added
  created_by_agency boolean DEFAULT false, -- Missing column added
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON COLUMN public.packages.considerar_diaria_motorista IS 'Flag para incluir diária do motorista no fechamento';
COMMENT ON COLUMN public.packages.valor_diaria_servico IS 'Valor cobrado pelo serviço diário do pacote.';
COMMENT ON COLUMN public.packages.created_by_agency IS 'Flag to indicate if the package was created by an agency.';

CREATE TABLE public.package_attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  attraction_id uuid NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  start_time time,
  end_time time,
  notes text,
  considerar_valor_net boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);
COMMENT ON COLUMN public.package_attractions.considerar_valor_net IS 'Flag para incluir valor NET do atrativo no fechamento';

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    status user_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for Performance
CREATE INDEX idx_packages_agency_id ON packages(agency_id);
CREATE INDEX idx_packages_vehicle_id ON packages(vehicle_id);
CREATE INDEX idx_packages_driver_id ON packages(driver_id);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_dates ON packages(start_date, end_date);
CREATE INDEX idx_package_attractions_package_id ON package_attractions(package_id);
CREATE INDEX idx_package_attractions_attraction_id ON package_attractions(attraction_id);
CREATE INDEX idx_package_attractions_date ON package_attractions(scheduled_date);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_attractions_valor_net ON attractions(valor_net);
CREATE INDEX idx_drivers_valor_diaria ON drivers(valor_diaria);
CREATE INDEX idx_package_attractions_considerar_valor ON package_attractions(considerar_valor_net);
CREATE INDEX idx_packages_considerar_diaria ON packages(considerar_diaria_motorista);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);


-- 4. Row Level Security (RLS)
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Generic policies for authenticated users (can be refined later)
CREATE POLICY "Authenticated users can manage all data" ON public.agencies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage all data" ON public.attractions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage all data" ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage all data" ON public.drivers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage all data" ON public.packages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage all data" ON public.package_attractions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Specific policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Service role can manage all profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Functions and Triggers

-- Function to get JWT claims
CREATE OR REPLACE FUNCTION public.get_my_claim(claim TEXT)
RETURNS JSONB AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::JSONB -> 'raw_app_meta_data' -> claim, 'null'::JSONB);
$$ LANGUAGE SQL STABLE;

-- Function to check for admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT (get_my_claim('is_admin'))::BOOLEAN;
$$ LANGUAGE SQL STABLE;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, is_admin, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
        FALSE,
        'pending'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to sync user claims
CREATE OR REPLACE FUNCTION private.sync_user_claims()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('is_admin', NEW.is_admin)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger to sync user claims
CREATE TRIGGER on_profile_change_sync_claims
  AFTER INSERT OR UPDATE OF is_admin ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_user_claims();

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update 'updated_at' on profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: Get Availability Stats
CREATE OR REPLACE FUNCTION get_availability_stats()
RETURNS availability_stats
LANGUAGE plpgsql
AS $$
DECLARE
  total_drivers_count BIGINT;
  total_vehicles_count BIGINT;
  busy_drivers_count BIGINT;
  busy_vehicles_count BIGINT;
  result availability_stats;
BEGIN
  PERFORM set_config('timezone', 'America/Campo_Grande', true);

  SELECT COUNT(*) INTO total_drivers_count FROM drivers WHERE status = 'available';
  SELECT COUNT(*) INTO total_vehicles_count FROM vehicles WHERE status = 'available';

  WITH busy_full_day AS (
    SELECT p.driver_id, p.vehicle_id
    FROM packages p
    JOIN package_attractions pa ON p.id = pa.package_id
    WHERE pa.scheduled_date = CURRENT_DATE
      AND pa.considerar_valor_net = false
      AND p.status IN ('confirmed', 'in_progress')
    GROUP BY p.driver_id, p.vehicle_id
  ),
  busy_by_time AS (
    SELECT p.driver_id, p.vehicle_id
    FROM packages p
    JOIN package_attractions pa ON p.id = pa.package_id
    JOIN attractions a ON pa.attraction_id = a.id
    WHERE pa.scheduled_date = CURRENT_DATE
      AND pa.considerar_valor_net = true
      AND p.status IN ('confirmed', 'in_progress')
      AND NOW()::time BETWEEN pa.start_time::time AND (pa.start_time::time + (a.estimated_duration || ' minutes')::interval + '1 hour'::interval)
    GROUP BY p.driver_id, p.vehicle_id
  ),
  combined_busy AS (
    SELECT driver_id, vehicle_id FROM busy_full_day
    UNION
    SELECT driver_id, vehicle_id FROM busy_by_time
  )
  SELECT
    COUNT(DISTINCT driver_id),
    COUNT(DISTINCT vehicle_id)
  INTO
    busy_drivers_count,
    busy_vehicles_count
  FROM combined_busy;

  result.available_drivers := GREATEST(0, total_drivers_count - busy_drivers_count);
  result.available_vehicles := GREATEST(0, total_vehicles_count - busy_vehicles_count);

  RETURN result;
END;
$$;

-- RPC: Upsert Package with Activities
CREATE OR REPLACE FUNCTION public.upsert_package_with_activities(
    p_package_data jsonb,
    p_activities_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_package_id uuid;
    activity jsonb;
BEGIN
    v_package_id := (p_package_data->>'id')::uuid;

    IF v_package_id IS NULL THEN
        INSERT INTO public.packages (
            title, agency_id, vehicle_id, driver_id, start_date, end_date,
            total_participants, notes, client_name, valor_diaria_servico,
            considerar_diaria_motorista, created_by_agency
        )
        VALUES (
            p_package_data->>'title',
            (p_package_data->>'agency_id')::uuid,
            (p_package_data->>'vehicle_id')::uuid,
            (p_package_data->>'driver_id')::uuid,
            (p_package_data->>'start_date')::date,
            (p_package_data->>'end_date')::date,
            (p_package_data->>'total_participants')::integer,
            p_package_data->>'notes',
            p_package_data->>'client_name',
            (p_package_data->>'valor_diaria_servico')::numeric,
            (p_package_data->>'considerar_diaria_motorista')::boolean,
            COALESCE((p_package_data->>'created_by_agency')::boolean, false)
        ) RETURNING id INTO v_package_id;
    ELSE
        UPDATE public.packages
        SET
            title = p_package_data->>'title',
            agency_id = (p_package_data->>'agency_id')::uuid,
            vehicle_id = (p_package_data->>'vehicle_id')::uuid,
            driver_id = (p_package_data->>'driver_id')::uuid,
            start_date = (p_package_data->>'start_date')::date,
            end_date = (p_package_data->>'end_date')::date,
            total_participants = (p_package_data->>'total_participants')::integer,
            notes = p_package_data->>'notes',
            client_name = p_package_data->>'client_name',
            valor_diaria_servico = (p_package_data->>'valor_diaria_servico')::numeric,
            considerar_diaria_motorista = (p_package_data->>'considerar_diaria_motorista')::boolean,
            updated_at = NOW()
        WHERE id = v_package_id;
    END IF;

    DELETE FROM public.package_attractions WHERE package_id = v_package_id;

    IF p_activities_data IS NOT NULL AND jsonb_array_length(p_activities_data) > 0 THEN
        FOR activity IN SELECT * FROM jsonb_array_elements(p_activities_data)
        LOOP
            INSERT INTO public.package_attractions (
                package_id,
                attraction_id,
                scheduled_date,
                start_time,
                notes,
                considerar_valor_net
            )
            VALUES (
                v_package_id,
                (activity->>'attraction_id')::uuid,
                (activity->>'scheduled_date')::date,
                (activity->>'start_time')::time,
                activity->>'notes',
                (activity->>'considerar_valor_net')::boolean
            );
        END LOOP;
    END IF;

    RETURN v_package_id;
END;
$$;

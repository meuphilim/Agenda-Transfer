/*
  # Schema de Gestão de Turismo

  1. Novas Tabelas
    - `agencies` - Cadastro de agências
    - `attractions` - Cadastro de atrativos turísticos
    - `vehicles` - Cadastro de veículos
    - `drivers` - Cadastro de motoristas
    - `packages` - Pacotes/reservas principais
    - `package_attractions` - Atrativos incluídos em cada pacote

  2. Relacionamentos
    - Packages -> Agencies (many-to-one)
    - Packages -> Vehicles (many-to-one)
    - Packages -> Drivers (many-to-one)
    - Package_Attractions -> Packages (many-to-one)
    - Package_Attractions -> Attractions (many-to-one)

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para usuários autenticados
*/

-- Agências
CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  cnpj text UNIQUE,
  address text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Atrativos
CREATE TABLE IF NOT EXISTS attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  estimated_duration integer DEFAULT 60, -- em minutos
  location text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Veículos
CREATE TABLE IF NOT EXISTS vehicles (
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

-- Motoristas
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  license_number text NOT NULL,
  license_expiry date,
  status text DEFAULT 'available' CHECK (status IN ('available', 'busy', 'unavailable')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pacotes/Reservas
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  agency_id uuid NOT NULL REFERENCES agencies(id),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  driver_id uuid NOT NULL REFERENCES drivers(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_participants integer DEFAULT 1,
  status text DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Atrativos do Pacote
CREATE TABLE IF NOT EXISTS package_attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  attraction_id uuid NOT NULL REFERENCES attractions(id),
  scheduled_date date NOT NULL,
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_attractions ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Authenticated users can read agencies"
  ON agencies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert agencies"
  ON agencies FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update agencies"
  ON agencies FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete agencies"
  ON agencies FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read attractions"
  ON attractions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert attractions"
  ON attractions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update attractions"
  ON attractions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete attractions"
  ON attractions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read vehicles"
  ON vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicles FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
  ON vehicles FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete vehicles"
  ON vehicles FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read drivers"
  ON drivers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert drivers"
  ON drivers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update drivers"
  ON drivers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete drivers"
  ON drivers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read packages"
  ON packages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert packages"
  ON packages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update packages"
  ON packages FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete packages"
  ON packages FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read package_attractions"
  ON package_attractions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert package_attractions"
  ON package_attractions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update package_attractions"
  ON package_attractions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete package_attractions"
  ON package_attractions FOR DELETE TO authenticated USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_packages_dates ON packages(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_package_attractions_date ON package_attractions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
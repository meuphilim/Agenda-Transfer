/*
  # Tourism Management System Database Schema

  1. New Tables
    - `agencies` - Travel agencies with contact information
    - `attractions` - Tourist attractions with details
    - `vehicles` - Fleet vehicles with specifications
    - `drivers` - Driver information and availability
    - `packages` - Tourism packages/reservations
    - `package_attractions` - Junction table for package attractions with scheduling
    - `schedules` - Driver/vehicle scheduling

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
    - Add policies for reading public data

  3. Relationships
    - packages -> agencies (many-to-one)
    - packages -> vehicles (many-to-one)
    - packages -> drivers (many-to-one)
    - package_attractions -> packages (many-to-one)
    - package_attractions -> attractions (many-to-one)
    - schedules -> drivers (many-to-one)
    - schedules -> vehicles (many-to-one)
*/

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
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

-- Create attractions table
CREATE TABLE IF NOT EXISTS attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  estimated_duration integer, -- in minutes
  location text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text NOT NULL UNIQUE,
  model text NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  status text DEFAULT 'available' CHECK (status IN ('available', 'busy', 'maintenance')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnh text,
  phone text,
  email text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'busy', 'off_duty')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  total_price decimal(10,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create package_attractions junction table
CREATE TABLE IF NOT EXISTS package_attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid REFERENCES packages(id) ON DELETE CASCADE,
  attraction_id uuid REFERENCES attractions(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(package_id, attraction_id, scheduled_date)
);

-- Create schedules table for driver/vehicle availability
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for agencies
CREATE POLICY "Anyone can read agencies"
  ON agencies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage agencies"
  ON agencies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for attractions
CREATE POLICY "Anyone can read attractions"
  ON attractions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage attractions"
  ON attractions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for vehicles
CREATE POLICY "Anyone can read vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for drivers
CREATE POLICY "Anyone can read drivers"
  ON drivers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage drivers"
  ON drivers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for packages
CREATE POLICY "Anyone can read packages"
  ON packages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage packages"
  ON packages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for package_attractions
CREATE POLICY "Anyone can read package_attractions"
  ON package_attractions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage package_attractions"
  ON package_attractions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for schedules
CREATE POLICY "Anyone can read schedules"
  ON schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage schedules"
  ON schedules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_packages_agency_id ON packages(agency_id);
CREATE INDEX IF NOT EXISTS idx_packages_vehicle_id ON packages(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_packages_driver_id ON packages(driver_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_dates ON packages(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_package_attractions_package_id ON package_attractions(package_id);
CREATE INDEX IF NOT EXISTS idx_package_attractions_attraction_id ON package_attractions(attraction_id);
CREATE INDEX IF NOT EXISTS idx_package_attractions_date ON package_attractions(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_schedules_driver_id ON schedules(driver_id);
CREATE INDEX IF NOT EXISTS idx_schedules_vehicle_id ON schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- Insert some sample data for testing
INSERT INTO agencies (name, contact_person, phone, email, cnpj) VALUES
('Turismo Aventura', 'João Silva', '(11) 99999-1111', 'joao@aventura.com', '12.345.678/0001-90'),
('Viagens & Cia', 'Maria Santos', '(11) 99999-2222', 'maria@viagens.com', '98.765.432/0001-10'),
('Explore Mais', 'Pedro Costa', '(11) 99999-3333', 'pedro@explore.com', '11.222.333/0001-44')
ON CONFLICT DO NOTHING;

INSERT INTO attractions (name, description, estimated_duration, location) VALUES
('Cristo Redentor', 'Monumento icônico no Corcovado', 180, 'Rio de Janeiro, RJ'),
('Pão de Açúcar', 'Bondinho e vista panorâmica', 120, 'Rio de Janeiro, RJ'),
('Museu do Amanhã', 'Museu de ciências', 90, 'Rio de Janeiro, RJ'),
('Jardim Botânico', 'Parque com diversidade de plantas', 150, 'Rio de Janeiro, RJ'),
('Santa Teresa', 'Bairro histórico e cultural', 240, 'Rio de Janeiro, RJ')
ON CONFLICT DO NOTHING;

INSERT INTO vehicles (license_plate, model, capacity) VALUES
('ABC-1234', 'Mercedes Sprinter', 20),
('DEF-5678', 'Iveco Daily', 16),
('GHI-9012', 'Volkswagen Crafter', 18),
('JKL-3456', 'Renault Master', 15)
ON CONFLICT DO NOTHING;

INSERT INTO drivers (name, cnh, phone, email) VALUES
('Carlos Motorista', '12345678901', '(11) 98888-1111', 'carlos@email.com'),
('Ana Condutora', '23456789012', '(11) 98888-2222', 'ana@email.com'),
('Roberto Silva', '34567890123', '(11) 98888-3333', 'roberto@email.com'),
('Lucia Santos', '45678901234', '(11) 98888-4444', 'lucia@email.com')
ON CONFLICT DO NOTHING;
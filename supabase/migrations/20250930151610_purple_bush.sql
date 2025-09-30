/*
  # Tourism Management System Database Schema

  1. New Tables
    - `agencies` - Travel agencies with contact information
    - `attractions` - Tourist attractions with details
    - `vehicles` - Fleet vehicles with specifications  
    - `drivers` - Driver information and availability
    - `packages` - Tourism packages/reservations
    - `package_attractions` - Junction table for package attractions with scheduling

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data

  3. Relationships
    - packages -> agencies (many-to-one)
    - packages -> vehicles (many-to-one)
    - packages -> drivers (many-to-one)
    - package_attractions -> packages (many-to-one)
    - package_attractions -> attractions (many-to-one)
*/

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS package_attractions CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS attractions CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;

-- Create agencies table
CREATE TABLE agencies (
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
CREATE TABLE attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  estimated_duration integer DEFAULT 60, -- in minutes
  location text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE vehicles (
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

-- Create drivers table
CREATE TABLE drivers (
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

-- Create packages table
CREATE TABLE packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_participants integer DEFAULT 1,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create package_attractions junction table
CREATE TABLE package_attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  attraction_id uuid NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_attractions ENABLE ROW LEVEL SECURITY;

-- Create policies for agencies
CREATE POLICY "Authenticated users can read agencies"
  ON agencies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert agencies"
  ON agencies FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update agencies"
  ON agencies FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete agencies"
  ON agencies FOR DELETE TO authenticated USING (true);

-- Create policies for attractions
CREATE POLICY "Authenticated users can read attractions"
  ON attractions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert attractions"
  ON attractions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update attractions"
  ON attractions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete attractions"
  ON attractions FOR DELETE TO authenticated USING (true);

-- Create policies for vehicles
CREATE POLICY "Authenticated users can read vehicles"
  ON vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicles FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
  ON vehicles FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete vehicles"
  ON vehicles FOR DELETE TO authenticated USING (true);

-- Create policies for drivers
CREATE POLICY "Authenticated users can read drivers"
  ON drivers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert drivers"
  ON drivers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update drivers"
  ON drivers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete drivers"
  ON drivers FOR DELETE TO authenticated USING (true);

-- Create policies for packages
CREATE POLICY "Authenticated users can read packages"
  ON packages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert packages"
  ON packages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update packages"
  ON packages FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete packages"
  ON packages FOR DELETE TO authenticated USING (true);

-- Create policies for package_attractions
CREATE POLICY "Authenticated users can read package_attractions"
  ON package_attractions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert package_attractions"
  ON package_attractions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update package_attractions"
  ON package_attractions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete package_attractions"
  ON package_attractions FOR DELETE TO authenticated USING (true);

-- Create indexes for better performance
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

-- Insert sample data for testing
INSERT INTO agencies (name, contact_person, phone, email, cnpj) VALUES
('Turismo Aventura', 'João Silva', '(11) 99999-1111', 'joao@aventura.com', '12.345.678/0001-90'),
('Viagens & Cia', 'Maria Santos', '(11) 99999-2222', 'maria@viagens.com', '98.765.432/0001-10'),
('Explore Mais', 'Pedro Costa', '(11) 99999-3333', 'pedro@explore.com', '11.222.333/0001-44');

INSERT INTO attractions (name, description, estimated_duration, location) VALUES
('Cristo Redentor', 'Monumento icônico no Corcovado', 180, 'Rio de Janeiro, RJ'),
('Pão de Açúcar', 'Bondinho e vista panorâmica', 120, 'Rio de Janeiro, RJ'),
('Museu do Amanhã', 'Museu de ciências', 90, 'Rio de Janeiro, RJ'),
('Jardim Botânico', 'Parque com diversidade de plantas', 150, 'Rio de Janeiro, RJ'),
('Santa Teresa', 'Bairro histórico e cultural', 240, 'Rio de Janeiro, RJ');

INSERT INTO vehicles (license_plate, model, brand, capacity) VALUES
('ABC-1234', 'Sprinter', 'Mercedes', 20),
('DEF-5678', 'Daily', 'Iveco', 16),
('GHI-9012', 'Crafter', 'Volkswagen', 18),
('JKL-3456', 'Master', 'Renault', 15);

INSERT INTO drivers (name, license_number, phone, email) VALUES
('Carlos Motorista', '12345678901', '(11) 98888-1111', 'carlos@email.com'),
('Ana Condutora', '23456789012', '(11) 98888-2222', 'ana@email.com'),
('Roberto Silva', '34567890123', '(11) 98888-3333', 'roberto@email.com'),
('Lucia Santos', '45678901234', '(11) 98888-4444', 'lucia@email.com');
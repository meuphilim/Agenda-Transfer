-- Add company_id to drivers and vehicles tables
ALTER TABLE public.drivers
ADD COLUMN company_id UUID REFERENCES public.company_profile(id) ON DELETE SET NULL;

ALTER TABLE public.vehicles
ADD COLUMN company_id UUID REFERENCES public.company_profile(id) ON DELETE SET NULL;

-- Create indexes for the new columns
CREATE INDEX idx_drivers_company_id ON public.drivers(company_id);
CREATE INDEX idx_vehicles_company_id ON public.vehicles(company_id);

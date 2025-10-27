-- supabase/migrations/20251027072900_create_get_availability_stats_rpc.sql

-- Define a custom type to structure the function's return value for clarity.
-- This makes it easier to consume the function from the frontend.
DROP TYPE IF EXISTS availability_stats;
CREATE TYPE availability_stats AS (
  available_drivers BIGINT,
  available_vehicles BIGINT
);

-- Drop the function if it already exists to ensure a clean deployment.
DROP FUNCTION IF EXISTS get_availability_stats();

-- Create the main RPC function to calculate availability.
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
  -- Set the timezone to ensure all date/time operations are consistent
  -- with the application's standard (America/Campo_Grande, GMT-4).
  PERFORM set_config('timezone', 'America/Campo_Grande', true);

  -- 1. Get the total number of active drivers and vehicles.
  -- These counts serve as the baseline for our availability calculation.
  SELECT COUNT(*) INTO total_drivers_count FROM drivers WHERE status = 'available';
  SELECT COUNT(*) INTO total_vehicles_count FROM vehicles WHERE status = 'available';

  -- 2. Identify drivers and vehicles that are definitively busy for the whole day.
  -- This applies to packages that have activities scheduled for today but DO NOT use
  -- the "net value" logic, implying a full-day commitment (diária).
  -- We use CTEs (Common Table Expressions) for readability and modularity.
  WITH busy_full_day AS (
    SELECT
      p.driver_id,
      p.vehicle_id
    FROM packages p
    JOIN package_attractions pa ON p.id = pa.package_id
    WHERE pa.scheduled_date = CURRENT_DATE
      AND pa.considerar_valor_net = false
      AND p.status IN ('confirmed', 'in_progress')
    GROUP BY p.driver_id, p.vehicle_id
  ),

  -- 3. Identify drivers and vehicles busy based on time-sensitive activities.
  -- This applies to packages that DO use the "net value" logic. A resource is
  -- considered busy only if the current time is within the activity's duration,
  -- plus a 1-hour buffer for travel.
  busy_by_time AS (
    SELECT
      p.driver_id,
      p.vehicle_id
    FROM packages p
    JOIN package_attractions pa ON p.id = pa.package_id
    JOIN attractions a ON pa.attraction_id = a.id
    WHERE pa.scheduled_date = CURRENT_DATE
      AND pa.considerar_valor_net = true
      AND p.status IN ('confirmed', 'in_progress')
      AND NOW() BETWEEN pa.start_time::time AND (pa.start_time::time + (a.estimated_duration || ' minutes')::interval + '1 hour'::interval)
    GROUP BY p.driver_id, p.vehicle_id
  ),

  -- 4. Combine both sets of busy resources into a single, unique list.
  -- We use UNION to merge the results from both CTEs and remove duplicates.
  -- The final count of this combined list gives us the total number of busy resources.
  combined_busy AS (
    SELECT driver_id, vehicle_id FROM busy_full_day
    UNION
    SELECT driver_id, vehicle_id FROM busy_by_time
  )

  -- 5. Calculate the final counts of busy drivers and vehicles.
  SELECT
    COUNT(DISTINCT driver_id),
    COUNT(DISTINCT vehicle_id)
  INTO
    busy_drivers_count,
    busy_vehicles_count
  FROM combined_busy;

  -- 6. Calculate available resources by subtracting the busy count from the total.
  -- We use GREATEST to ensure the result is never negative, even with potential data anomalies.
  result.available_drivers := GREATEST(0, total_drivers_count - busy_drivers_count);
  result.available_vehicles := GREATEST(0, total_vehicles_count - busy_vehicles_count);

  -- 7. Return the final structured result.
  RETURN result;
END;
$$;

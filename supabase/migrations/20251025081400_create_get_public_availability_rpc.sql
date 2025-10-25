
create or replace function get_public_availability(start_date date, end_date date)
returns table (
  available_date date,
  is_available boolean
) as $$
begin
  return query
  with date_series as (
    -- Gera uma série de todas as datas no intervalo solicitado
    select generate_series(start_date, end_date, '1 day'::interval)::date as day
  ),
  total_resources as (
    -- Conta o número total de veículos e motoristas ativos
    select
      (select count(*) from vehicles where status = 'active') as total_vehicles,
      (select count(*) from drivers where status = 'active') as total_drivers
  ),
  occupied_resources as (
    -- Conta o número de veículos e motoristas únicos ocupados em cada dia
    select
      pa.scheduled_date,
      count(distinct p.vehicle_id) as occupied_vehicles,
      count(distinct p.driver_id) as occupied_drivers
    from package_attractions pa
    join packages p on pa.package_id = p.id
    where
      pa.scheduled_date >= start_date
      and pa.scheduled_date <= end_date
      and p.status in ('confirmed', 'in_progress')
    group by
      pa.scheduled_date
  )
  -- Compara recursos totais com recursos ocupados para determinar a disponibilidade
  select
    ds.day as available_date,
    (
      (tr.total_vehicles - coalesce(oc.occupied_vehicles, 0)) > 0
      and
      (tr.total_drivers - coalesce(oc.occupied_drivers, 0)) > 0
    ) as is_available
  from
    date_series ds
    cross join total_resources tr
    left join occupied_resources oc on ds.day = oc.scheduled_date
  order by
    ds.day;
end;
$$ language plpgsql;

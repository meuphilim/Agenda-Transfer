
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
    v_user_id uuid := auth.uid();
    activity jsonb;
BEGIN
    -- Extrair o ID do pacote dos dados. Se não existir, é um INSERT.
    v_package_id := (p_package_data->>'id')::uuid;

    -- Upsert na tabela 'packages'
    IF v_package_id IS NULL THEN
        -- INSERT
        INSERT INTO public.packages (
            title, agency_id, vehicle_id, driver_id, start_date, end_date,
            total_participants, notes, client_name, valor_diaria_servico,
            considerar_diaria_motorista, created_by_agency, user_id
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
            COALESCE((p_package_data->>'created_by_agency')::boolean, false),
            v_user_id
        ) RETURNING id INTO v_package_id;
    ELSE
        -- UPDATE
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

    -- Deletar atividades antigas associadas ao pacote
    DELETE FROM public.package_attractions WHERE package_id = v_package_id;

    -- Inserir as novas atividades do array JSON
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

    -- Retornar o ID do pacote processado
    RETURN v_package_id;
END;
$$;

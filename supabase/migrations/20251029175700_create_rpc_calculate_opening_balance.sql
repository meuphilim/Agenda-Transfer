-- This migration REPLACES the previous function definition with a corrected one
-- that queries the newly created financial tables.

CREATE OR REPLACE FUNCTION calculate_opening_balance(p_start_date date)
RETURNS numeric AS $$
DECLARE
    total_credits numeric;
    total_debits numeric;
BEGIN
    -- Calculate total credits from paid settlements
    SELECT COALESCE(SUM((details->>'totalValuePaid')::numeric), 0)
    INTO total_credits
    FROM public.settlements
    WHERE created_at < p_start_date;

    -- Calculate total debits from paid driver rates and vehicle expenses
    SELECT COALESCE(SUM(amount), 0)
    INTO total_debits
    FROM (
        SELECT amount FROM public.driver_daily_rates WHERE date < p_start_date AND paid = true
        UNION ALL
        SELECT amount FROM public.vehicle_expenses WHERE date < p_start_date -- Assumed paid on creation
    ) AS expenses;

    RETURN total_credits - total_debits;
END;
$$ LANGUAGE plpgsql;

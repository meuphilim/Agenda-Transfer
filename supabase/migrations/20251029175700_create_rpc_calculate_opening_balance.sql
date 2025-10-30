CREATE OR REPLACE FUNCTION calculate_opening_balance(p_start_date date)
RETURNS numeric AS $$
DECLARE
    total_credits numeric;
    total_debits numeric;
BEGIN
    -- Calculate total credits from settlements
    SELECT COALESCE(SUM((details->>'totalValuePaid')::numeric), 0)
    INTO total_credits
    FROM settlements
    WHERE created_at < p_start_date;

    -- Calculate total debits from driver rates and vehicle expenses
    SELECT COALESCE(SUM(amount), 0)
    INTO total_debits
    FROM (
        SELECT amount FROM driver_daily_rates WHERE date < p_start_date
        UNION ALL
        SELECT amount FROM vehicle_expenses WHERE date < p_start_date
    ) AS expenses;

    RETURN total_credits - total_debits;
END;
$$ LANGUAGE plpgsql;

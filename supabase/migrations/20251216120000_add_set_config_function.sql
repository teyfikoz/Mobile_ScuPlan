/*
  # Add set_config RPC function

  This function is required for Row Level Security to work properly.
  It allows the application to set the device_id context for RLS policies.
*/

CREATE OR REPLACE FUNCTION set_config(
  setting_name text,
  setting_value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, false);
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION set_config(text, text) TO anon;
GRANT EXECUTE ON FUNCTION set_config(text, text) TO authenticated;

COMMENT ON FUNCTION set_config IS 'Sets configuration parameter for Row Level Security policies';

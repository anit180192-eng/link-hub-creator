-- Exercise the actual deployed CHECK without changing customer rows.
BEGIN;
CREATE TEMP TABLE widget_limit_test (home_widgets jsonb);
DO $$
DECLARE definition text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO definition FROM pg_constraint
    WHERE conrelid = 'public.pages'::regclass AND conname = 'pages_home_widgets_array';
  EXECUTE 'ALTER TABLE widget_limit_test ADD CONSTRAINT widget_limit_test_check ' || definition;
END $$;
INSERT INTO widget_limit_test VALUES (NULL), ('[]'),
('[{"id":"clock"},{"id":"world"},{"id":"favourites"},{"id":"visited"},{"id":"recent"},{"id":"notes"},{"id":"tasks"},{"id":"focus"},{"id":"calendar"}]');
DO $$ BEGIN
  BEGIN
    INSERT INTO widget_limit_test SELECT jsonb_agg(i) FROM generate_series(1,10) i;
    RAISE EXCEPTION 'More than nine widgets unexpectedly accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO widget_limit_test VALUES ('{}');
    RAISE EXCEPTION 'Invalid object unexpectedly accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT 'PASS: NULL, empty and nine widgets accepted; ten widgets and objects rejected' AS result;
ROLLBACK;

-- Phase 2 adds four optional widgets; preserve all existing layouts and RLS.
ALTER TABLE public.pages DROP CONSTRAINT pages_home_widgets_array;
ALTER TABLE public.pages ADD CONSTRAINT pages_home_widgets_array CHECK (
  home_widgets IS NULL OR CASE WHEN jsonb_typeof(home_widgets) = 'array'
    THEN jsonb_array_length(home_widgets) <= 9 ELSE false END
);

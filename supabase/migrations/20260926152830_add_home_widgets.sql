-- NULL preserves the layout of existing profiles; future profiles start empty.
ALTER TABLE public.pages ADD COLUMN home_widgets jsonb;
ALTER TABLE public.pages ALTER COLUMN home_widgets SET DEFAULT '[]'::jsonb;
ALTER TABLE public.pages ADD CONSTRAINT pages_home_widgets_array CHECK (
  home_widgets IS NULL OR (jsonb_typeof(home_widgets) = 'array' AND jsonb_array_length(home_widgets) <= 5)
);
COMMENT ON COLUMN public.pages.home_widgets IS 'Ordered Home widgets and widths. NULL means legacy layout; [] means empty Home.';

-- Allow the tenth optional Home widget without changing saved layouts or RLS.
ALTER TABLE public.pages DROP CONSTRAINT pages_home_widgets_array;
ALTER TABLE public.pages ADD CONSTRAINT pages_home_widgets_array CHECK (
  home_widgets IS NULL OR CASE WHEN jsonb_typeof(home_widgets) = 'array'
    THEN jsonb_array_length(home_widgets) <= 10 ELSE false END
);

-- Enforce the total featured-link limit even for direct database writes.
ALTER TABLE public.pages ADD CONSTRAINT pages_featured_links_limit CHECK (
  home_widgets IS NULL OR jsonb_array_length(
    jsonb_path_query_array(home_widgets, '$[*] ? (@.id == "featured").links[*]')
  ) <= 10
);

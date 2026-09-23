CREATE TABLE public.page_tabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Links',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_tabs TO authenticated;
GRANT ALL ON public.page_tabs TO service_role;

ALTER TABLE public.page_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their page tabs"
ON public.page_tabs
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.pages p
    WHERE p.id = page_tabs.page_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.pages p
    WHERE p.id = page_tabs.page_id AND p.user_id = auth.uid()
  )
);

CREATE TRIGGER update_page_tabs_updated_at
BEFORE UPDATE ON public.page_tabs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.links
  ADD COLUMN tab_id uuid REFERENCES public.page_tabs(id) ON DELETE SET NULL,
  ADD COLUMN favourite boolean NOT NULL DEFAULT false;

ALTER TABLE public.pages
  ADD COLUMN weather_city text NOT NULL DEFAULT '';

INSERT INTO public.page_tabs (page_id, user_id, name, position)
SELECT p.id, p.user_id, 'Links', 0
FROM public.pages p
ON CONFLICT (page_id, name) DO NOTHING;

UPDATE public.links l
SET tab_id = t.id
FROM public.page_tabs t
WHERE t.page_id = l.page_id
  AND t.name = 'Links'
  AND l.tab_id IS NULL;

CREATE INDEX page_tabs_page_position_idx ON public.page_tabs(page_id, position);
CREATE INDEX links_tab_position_idx ON public.links(tab_id, position);
CREATE TABLE public.page_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  tab_id uuid NOT NULL REFERENCES public.page_tabs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tab_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_folders TO authenticated;
GRANT ALL ON public.page_folders TO service_role;

ALTER TABLE public.page_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their page folders"
ON public.page_folders
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.pages p
    WHERE p.id = page_folders.page_id AND p.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.page_tabs t
    WHERE t.id = page_folders.tab_id
      AND t.page_id = page_folders.page_id
      AND t.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.pages p
    WHERE p.id = page_folders.page_id AND p.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.page_tabs t
    WHERE t.id = page_folders.tab_id
      AND t.page_id = page_folders.page_id
      AND t.user_id = auth.uid()
  )
);

CREATE TRIGGER update_page_folders_updated_at
BEFORE UPDATE ON public.page_folders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX page_folders_tab_position_idx ON public.page_folders(tab_id, position);
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My page',
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  avatar_url text,
  theme text NOT NULL DEFAULT 'grid',
  dark_mode boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT false,
  clocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT SELECT ON public.pages TO anon;
GRANT ALL ON public.pages TO service_role;

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their pages" ON public.pages
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Published pages are public" ON public.pages
  FOR SELECT TO anon
  USING (published = true);

CREATE INDEX pages_user_id_idx ON public.pages(user_id);

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Copy each existing profile across as that user's first page
INSERT INTO public.pages (user_id, name, slug, display_name, tagline, avatar_url, theme, dark_mode, published, clocks, created_at)
SELECT id, 'Personal', slug, display_name, tagline, avatar_url, theme, dark_mode, published, clocks, created_at
FROM public.profiles;

-- Links now belong to a page
ALTER TABLE public.links ADD COLUMN page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE;

UPDATE public.links l
SET page_id = (SELECT p.id FROM public.pages p WHERE p.user_id = l.user_id ORDER BY p.created_at LIMIT 1)
WHERE l.page_id IS NULL;

DELETE FROM public.links WHERE page_id IS NULL;

ALTER TABLE public.links ALTER COLUMN page_id SET NOT NULL;
CREATE INDEX links_page_id_idx ON public.links(page_id);

DROP POLICY IF EXISTS "Links of published profiles are public" ON public.links;
DROP POLICY IF EXISTS "Owners manage their links" ON public.links;

CREATE POLICY "Owners manage their links" ON public.links
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.pages p WHERE p.id = links.page_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Links of published pages are public" ON public.links
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.pages p WHERE p.id = links.page_id AND p.published = true));
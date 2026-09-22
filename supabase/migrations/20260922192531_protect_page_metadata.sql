-- Only intentionally unprotected pages are readable through the anonymous API.
-- Protected-page lookup and unlock happen on the server; owners retain their
-- existing authenticated policy for managing every page in their account.
ALTER POLICY "Published pages are public" ON public.pages
  USING (published = true AND pin_protected = false);

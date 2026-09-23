CREATE TABLE public.page_security (
  page_id uuid PRIMARY KEY REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pin_hash text NOT NULL,
  pin_salt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.page_security TO service_role;
ALTER TABLE public.page_security ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_page_security_updated_at BEFORE UPDATE ON public.page_security FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.device_tokens ADD COLUMN page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE;
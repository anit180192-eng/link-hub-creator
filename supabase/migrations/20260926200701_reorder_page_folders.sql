-- Atomic, owner-only ordering. Existing RLS remains in force.
CREATE OR REPLACE FUNCTION public.reorder_page_folders(p_page_id uuid, p_tab_id uuid, p_names text[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE expected text[]; first_tab uuid; owner_id uuid;
BEGIN
  owner_id := auth.uid();
  IF owner_id IS NULL THEN RAISE EXCEPTION 'Sign in to reorder folders'; END IF;
  PERFORM 1 FROM public.page_tabs t JOIN public.pages p ON p.id=t.page_id
    WHERE t.id=p_tab_id AND p.id=p_page_id AND p.user_id=owner_id AND t.user_id=owner_id FOR UPDATE OF t;
  IF NOT FOUND THEN RAISE EXCEPTION 'Folder access denied'; END IF;
  SELECT id INTO first_tab FROM public.page_tabs WHERE page_id=p_page_id ORDER BY position,id LIMIT 1;
  SELECT array_agg(name ORDER BY name) INTO expected FROM (
    SELECT COALESCE(NULLIF(btrim(name),''),'Folder 1') AS name FROM public.page_folders WHERE page_id=p_page_id AND tab_id=p_tab_id
    UNION
    SELECT COALESCE(NULLIF(btrim(group_name),''),'Folder 1') FROM public.links WHERE page_id=p_page_id AND (tab_id=p_tab_id OR (tab_id IS NULL AND p_tab_id=first_tab))
  ) names;
  IF p_names IS NULL OR cardinality(p_names)=0 OR array_position(p_names,NULL) IS NOT NULL
    OR cardinality(p_names) <> (SELECT count(DISTINCT name) FROM unnest(p_names) name)
    OR cardinality(p_names) <> COALESCE(cardinality(expected),0) OR NOT p_names @> expected
    THEN RAISE EXCEPTION 'Folders changed. Refresh and try again.'; END IF;
  -- Materialize legacy folders that only exist as link group names.
  INSERT INTO public.page_folders(page_id,tab_id,user_id,name,position)
    SELECT p_page_id,p_tab_id,owner_id,n.name,(n.ordinality-1)::integer FROM unnest(p_names) WITH ORDINALITY n(name,ordinality)
    WHERE NOT EXISTS (SELECT 1 FROM public.page_folders f WHERE f.tab_id=p_tab_id AND COALESCE(NULLIF(btrim(f.name),''),'Folder 1')=n.name);
  UPDATE public.page_folders f SET position=(n.ordinality-1)::integer
    FROM unnest(p_names) WITH ORDINALITY n(name,ordinality)
    WHERE f.page_id=p_page_id AND f.tab_id=p_tab_id AND COALESCE(NULLIF(btrim(f.name),''),'Folder 1')=n.name;
END;
$$;
REVOKE ALL ON FUNCTION public.reorder_page_folders(uuid,uuid,text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_page_folders(uuid,uuid,text[]) TO authenticated;

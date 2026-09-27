CREATE SCHEMA IF NOT EXISTS lpb_private;
REVOKE ALL ON SCHEMA lpb_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA lpb_private TO authenticated;
ALTER FUNCTION public.my_organisation_plan() SET SCHEMA lpb_private;
CREATE OR REPLACE FUNCTION public.reorder_page_tabs(p_page_id uuid, p_ids uuid[]) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE owner_id uuid := auth.uid(); old_ids uuid[]; max_tabs int; max_pages int;
BEGIN
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
 PERFORM 1 FROM public.pages WHERE id=p_page_id AND user_id=owner_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile access denied'; END IF;
 max_tabs := CASE WHEN lpb_private.my_organisation_plan()='premium' THEN 50 ELSE 5 END;
 max_pages := CASE WHEN max_tabs=50 THEN 10 ELSE 2 END;
 IF NOT EXISTS (SELECT 1 FROM (SELECT id FROM public.pages WHERE user_id=owner_id ORDER BY created_at,id LIMIT max_pages) p WHERE id=p_page_id) THEN RAISE EXCEPTION 'Profile is archived'; END IF;
 PERFORM 1 FROM public.page_tabs WHERE page_id=p_page_id ORDER BY id FOR UPDATE;
 SELECT array_agg(id ORDER BY position,id) INTO old_ids FROM public.page_tabs WHERE page_id=p_page_id;
 IF p_ids IS NULL OR cardinality(p_ids)=0 OR array_position(p_ids,NULL) IS NOT NULL
 OR cardinality(p_ids) <> COALESCE(cardinality(old_ids),0)
 OR cardinality(p_ids) <> (SELECT count(DISTINCT id) FROM unnest(p_ids) id)
 OR NOT p_ids @> old_ids THEN RAISE EXCEPTION 'Tabs changed. Refresh and try again.'; END IF;
 IF old_ids[max_tabs+1:cardinality(old_ids)] IS DISTINCT FROM p_ids[max_tabs+1:cardinality(p_ids)] THEN RAISE EXCEPTION 'Archived tabs cannot be reordered'; END IF;
 -- Keep older unassigned links with their original tab after its position changes.
 UPDATE public.links SET tab_id=old_ids[1] WHERE page_id=p_page_id AND tab_id IS NULL;
 UPDATE public.page_tabs t SET position=(n.ordinality-1)::int
 FROM unnest(p_ids) WITH ORDINALITY n(id,ordinality) WHERE t.id=n.id AND t.page_id=p_page_id;
END $$;
REVOKE ALL ON FUNCTION public.reorder_page_tabs(uuid,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reorder_page_tabs(uuid,uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.move_page_folder(p_page_id uuid,p_source_tab uuid,p_target_tab uuid,p_name text) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE owner_id uuid := auth.uid(); ids uuid[]; new_name text; original_name text; suffix int := 1; next_pos int; max_tabs int; max_pages int;
BEGIN
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
 PERFORM 1 FROM public.pages WHERE id=p_page_id AND user_id=owner_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile access denied'; END IF;
 IF p_source_tab=p_target_tab THEN RAISE EXCEPTION 'Choose another tab'; END IF;
 max_tabs := CASE WHEN lpb_private.my_organisation_plan()='premium' THEN 50 ELSE 5 END;
 max_pages := CASE WHEN max_tabs=50 THEN 10 ELSE 2 END;
 IF NOT EXISTS (SELECT 1 FROM (SELECT id FROM public.pages WHERE user_id=owner_id ORDER BY created_at,id LIMIT max_pages) p WHERE id=p_page_id) THEN RAISE EXCEPTION 'Profile is archived'; END IF;
 PERFORM 1 FROM public.page_tabs WHERE page_id=p_page_id ORDER BY id FOR UPDATE;
 SELECT array_agg(id ORDER BY position,id) INTO ids FROM public.page_tabs WHERE page_id=p_page_id;
 IF NOT COALESCE(p_source_tab=ANY(ids[1:max_tabs]),false) OR NOT COALESCE(p_target_tab=ANY(ids[1:max_tabs]),false) THEN RAISE EXCEPTION 'Choose active tabs in this profile'; END IF;
 original_name := COALESCE(NULLIF(btrim(p_name),''),'Folder 1');
 IF NOT EXISTS(SELECT 1 FROM public.page_folders WHERE page_id=p_page_id AND tab_id=p_source_tab AND COALESCE(NULLIF(btrim(name),''),'Folder 1')=original_name)
 AND NOT EXISTS(SELECT 1 FROM public.links WHERE page_id=p_page_id AND (tab_id=p_source_tab OR (tab_id IS NULL AND p_source_tab=ids[1])) AND COALESCE(NULLIF(btrim(group_name),''),'Folder 1')=original_name) THEN RAISE EXCEPTION 'Folder changed. Refresh and try again.'; END IF;
 new_name := left(original_name,40);
 WHILE EXISTS(SELECT 1 FROM public.page_folders WHERE tab_id=p_target_tab AND COALESCE(NULLIF(btrim(name),''),'Folder 1')=new_name)
 OR EXISTS(SELECT 1 FROM public.links WHERE page_id=p_page_id AND (tab_id=p_target_tab OR (tab_id IS NULL AND p_target_tab=ids[1])) AND COALESCE(NULLIF(btrim(group_name),''),'Folder 1')=new_name) LOOP
 suffix := suffix+1; new_name := left(original_name,40-length(' ('||suffix||')'))||' ('||suffix||')';
 END LOOP;
 SELECT COALESCE(max(position),-1)+1 INTO next_pos FROM public.page_folders WHERE tab_id=p_target_tab;
 INSERT INTO public.page_folders(page_id,tab_id,user_id,name,position) VALUES(p_page_id,p_target_tab,owner_id,new_name,next_pos);
 UPDATE public.links SET tab_id=p_target_tab,group_name=new_name WHERE page_id=p_page_id AND (tab_id=p_source_tab OR (tab_id IS NULL AND p_source_tab=ids[1])) AND COALESCE(NULLIF(btrim(group_name),''),'Folder 1')=original_name;
 DELETE FROM public.page_folders WHERE page_id=p_page_id AND tab_id=p_source_tab AND COALESCE(NULLIF(btrim(name),''),'Folder 1')=original_name;
 RETURN new_name;
END $$;
REVOKE ALL ON FUNCTION public.move_page_folder(uuid,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.move_page_folder(uuid,uuid,uuid,text) TO authenticated;

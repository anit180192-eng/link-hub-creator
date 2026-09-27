-- All fixture changes are rolled back; no user content is retained or removed.
BEGIN;
CREATE TEMP TABLE org_fixture AS SELECT p.id page_id,p.user_id,
 (SELECT array_agg(id ORDER BY position,id) FROM public.page_tabs WHERE page_id=p.id) ids,
 gen_random_uuid() link_id,
 'Move test '||left(gen_random_uuid()::text,8) name
 FROM public.pages p WHERE p.id=(SELECT id FROM public.pages WHERE user_id=p.user_id ORDER BY created_at,id LIMIT 1)
 AND (SELECT count(*) FROM public.page_tabs WHERE page_id=p.id)>=2 LIMIT 1;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM org_fixture) THEN RAISE EXCEPTION 'Need an active profile with two tabs'; END IF; END $$;
GRANT SELECT ON org_fixture TO authenticated;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM org_fixture),true) IS NOT NULL AS identity_set;
SET LOCAL ROLE authenticated;
INSERT INTO public.links(id,page_id,user_id,tab_id,label,url,platform,group_name,position)
SELECT link_id,page_id,user_id,NULL,'Test link','https://example.com','website',name,999 FROM org_fixture;
INSERT INTO public.page_folders(page_id,user_id,tab_id,name,position)
SELECT page_id,user_id,ids[2],name,999 FROM org_fixture;
DO $$ DECLARE f record; reversed uuid[]; moved text; BEGIN
 SELECT * INTO f FROM org_fixture;
 reversed:=f.ids; reversed[1]:=f.ids[2]; reversed[2]:=f.ids[1];
 PERFORM public.reorder_page_tabs(f.page_id,reversed);
 IF (SELECT tab_id FROM public.links WHERE id=f.link_id) IS DISTINCT FROM f.ids[1] THEN RAISE EXCEPTION 'Legacy link changed tabs'; END IF;
 IF (SELECT id FROM public.page_tabs WHERE page_id=f.page_id ORDER BY position,id LIMIT 1) <> f.ids[2] THEN RAISE EXCEPTION 'Order not saved'; END IF;
 moved:=public.move_page_folder(f.page_id,f.ids[1],f.ids[2],f.name);
 IF moved<>f.name||' (2)' THEN RAISE EXCEPTION 'Collision not renamed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.links WHERE id=f.link_id AND tab_id=f.ids[2] AND group_name=moved) THEN RAISE EXCEPTION 'Link was lost'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.page_folders WHERE tab_id=f.ids[2] AND name=f.name) THEN RAISE EXCEPTION 'Existing folder changed'; END IF;
 -- Empty folders move too.
 moved:=public.move_page_folder(f.page_id,f.ids[2],f.ids[1],f.name);
 IF NOT EXISTS(SELECT 1 FROM public.page_folders WHERE tab_id=f.ids[1] AND name=moved) THEN RAISE EXCEPTION 'Empty folder lost'; END IF;
 BEGIN PERFORM public.reorder_page_tabs(f.page_id,ARRAY[f.ids[1],f.ids[1]]); RAISE EXCEPTION 'Stale order accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Tabs changed. Refresh and try again.' THEN RAISE; END IF; END;
 BEGIN PERFORM public.move_page_folder(f.page_id,f.ids[1],gen_random_uuid(),f.name); RAISE EXCEPTION 'Foreign tab accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Choose active tabs in this profile' THEN RAISE; END IF; END;
 UPDATE public.pages SET social_links='[{"platform":"instagram","url":"https://instagram.com/demo","label":"Demo"},{"platform":"website","url":"https://example.com"}]' WHERE id=f.page_id;
 BEGIN UPDATE public.pages SET social_links='[{"platform":"website","url":"javascript:alert(1)"}]' WHERE id=f.page_id; RAISE EXCEPTION 'Unsafe social URL accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000000',true) IS NOT NULL AS outsider_set;
DO $$ DECLARE f record; BEGIN SELECT * INTO f FROM org_fixture;
 BEGIN PERFORM public.reorder_page_tabs(f.page_id,f.ids); RAISE EXCEPTION 'Non-owner accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Profile access denied' THEN RAISE; END IF; END;
 BEGIN PERFORM public.move_page_folder(f.page_id,f.ids[1],f.ids[2],f.name); RAISE EXCEPTION 'Non-owner move accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Profile access denied' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
SELECT 'PASS: ordering, legacy links, collision rename, empty-folder move, invalid order, foreign tabs, social URL validation and ownership' result
WHERE NOT has_function_privilege('anon','public.reorder_page_tabs(uuid,uuid[])','EXECUTE') AND NOT has_function_privilege('anon','public.move_page_folder(uuid,uuid,uuid,text)','EXECUTE');
ROLLBACK;

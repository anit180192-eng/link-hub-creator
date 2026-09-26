-- All changes, including test folder reordering, are rolled back.
BEGIN;
CREATE TEMP TABLE reorder_fixture AS
SELECT page_id,tab_id,user_id FROM public.page_folders
GROUP BY page_id,tab_id,user_id HAVING count(*) >= 2 LIMIT 1;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM reorder_fixture) THEN RAISE EXCEPTION 'Need a tab with two folders to run the regression'; END IF; END $$;
ALTER TABLE reorder_fixture ADD COLUMN names text[];
UPDATE reorder_fixture f SET names=(SELECT array_agg(name ORDER BY name DESC) FROM (
 SELECT COALESCE(NULLIF(btrim(name),''),'Folder 1') AS name FROM public.page_folders WHERE tab_id=f.tab_id
 UNION
 SELECT COALESCE(NULLIF(btrim(group_name),''),'Folder 1') FROM public.links WHERE page_id=f.page_id AND (tab_id=f.tab_id OR (tab_id IS NULL AND f.tab_id=(SELECT id FROM public.page_tabs WHERE page_id=f.page_id ORDER BY position,id LIMIT 1)))
) names);
GRANT SELECT ON reorder_fixture TO authenticated;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM reorder_fixture),true) IS NOT NULL AS test_identity_set;
SET LOCAL ROLE authenticated;
SELECT public.reorder_page_folders(page_id,tab_id,names) FROM reorder_fixture;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM reorder_fixture f, unnest(f.names) WITH ORDINALITY n(name,ordinality) WHERE NOT EXISTS(SELECT 1 FROM public.page_folders p WHERE p.tab_id=f.tab_id AND COALESCE(NULLIF(btrim(p.name),''),'Folder 1')=n.name AND p.position=n.ordinality-1)) THEN RAISE EXCEPTION 'Order not persisted'; END IF;
 BEGIN
   PERFORM public.reorder_page_folders(page_id,tab_id,ARRAY['not-a-real-folder']) FROM reorder_fixture;
   RAISE EXCEPTION 'Expected stale folder rejection';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Folders changed. Refresh and try again.' THEN RAISE; END IF; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000000',true) IS NOT NULL AS other_identity_set;
DO $$ BEGIN
 BEGIN
   PERFORM public.reorder_page_folders(page_id,tab_id,names) FROM reorder_fixture;
   RAISE EXCEPTION 'Expected owner rejection';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Folder access denied' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
SELECT 'PASS: authenticated order saved, stale input and non-owner rejected, anonymous execution blocked' AS result WHERE NOT has_function_privilege('anon','public.reorder_page_folders(uuid,uuid,text[])','EXECUTE');
ROLLBACK;

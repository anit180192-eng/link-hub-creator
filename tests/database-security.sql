-- Run inside a transaction and roll back. No real users or pages are modified.
BEGIN;
DO $$
DECLARE
  owner_a uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  open_page uuid := gen_random_uuid();
  private_page uuid := gen_random_uuid();
  draft_page uuid := gen_random_uuid();
  other_page uuid := gen_random_uuid();
  result record;
  total integer;
BEGIN
  INSERT INTO auth.users(id) VALUES (owner_a), (owner_b);
  INSERT INTO public.pages(id,user_id,slug,published,pin_protected) VALUES
    (open_page,owner_a,open_page::text,true,false),
    (private_page,owner_a,private_page::text,true,true),
    (draft_page,owner_a,draft_page::text,false,false),
    (other_page,owner_b,other_page::text,true,false);
  INSERT INTO public.links(user_id,page_id,url) VALUES
    (owner_a,open_page,'https://example.com/open'),
    (owner_a,private_page,'https://example.com/private'),
    (owner_a,draft_page,'https://example.com/draft'),
    (owner_b,other_page,'https://example.com/other');

  EXECUTE 'SET LOCAL ROLE anon';
  SELECT count(*) INTO total FROM public.pages WHERE id IN (open_page,private_page,draft_page);
  ASSERT total = 1, 'Anonymous visitors can read protected or draft page metadata';
  SELECT count(*) INTO total FROM public.links WHERE page_id IN (open_page,private_page,draft_page);
  ASSERT total = 1, 'Anonymous visitors can read private or draft links';
  ASSERT NOT has_table_privilege('anon','public.account_security','SELECT'), 'PIN hashes exposed';
  ASSERT NOT has_table_privilege('anon','public.pages','TRUNCATE'), 'Anonymous TRUNCATE granted';
  ASSERT NOT has_function_privilege('anon','public.reserve_pin_attempt(uuid,text)','EXECUTE'), 'Anonymous rate-limit access';
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claim.sub',owner_a::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO total FROM public.pages WHERE id IN (open_page,private_page,draft_page,other_page);
  ASSERT total = 3, 'Owners cannot read their pages or can read another account';
  SELECT count(*) INTO total FROM public.links WHERE page_id IN (open_page,private_page,draft_page,other_page);
  ASSERT total = 3, 'Cross-account links visible';
  UPDATE public.pages SET tagline='blocked' WHERE id=other_page;
  GET DIAGNOSTICS total = ROW_COUNT;
  ASSERT total = 0, 'Cross-account page update allowed';
  BEGIN
    INSERT INTO public.links(user_id,page_id,url) VALUES(owner_a,other_page,'https://example.com/blocked');
    RAISE EXCEPTION 'Cross-account link insertion allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  ASSERT NOT has_column_privilege('authenticated','public.device_tokens','token_hash','SELECT'), 'Token hashes exposed';
  ASSERT NOT has_table_privilege('authenticated','public.pages','TRUNCATE'), 'Authenticated TRUNCATE granted';
  ASSERT NOT has_function_privilege('authenticated','public.reserve_pin_attempt(uuid,text)','EXECUTE'), 'Client rate-limit access';
  EXECUTE 'RESET ROLE';

  EXECUTE 'SET LOCAL ROLE service_role';
  FOR i IN 1..5 LOOP
    SELECT * INTO result FROM public.reserve_pin_attempt(owner_a,repeat('a',64));
    ASSERT result.allowed AND result.remaining=5-i, 'Attempt reservation count incorrect';
  END LOOP;
  SELECT * INTO result FROM public.reserve_pin_attempt(owner_a,repeat('a',64));
  ASSERT NOT result.allowed, 'Sixth per-IP attempt allowed';
  FOR i IN 6..30 LOOP
    SELECT * INTO result FROM public.reserve_pin_attempt(owner_a,lpad(to_hex(i),64,'0'));
    ASSERT result.allowed, 'Owner reservation prematurely denied';
  END LOOP;
  SELECT * INTO result FROM public.reserve_pin_attempt(owner_a,repeat('b',64));
  ASSERT NOT result.allowed, 'Owner limit bypassed with different IP';
  EXECUTE 'RESET ROLE';
END;
$$;
ROLLBACK;

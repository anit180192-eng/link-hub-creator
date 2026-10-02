alter table public.pages
  add column notepad_enabled boolean not null default false,
  add column notepad_content text not null default '',
  add column landing_tab text not null default '__home';

alter table public.links
  add column comment_text text not null default '';

alter table public.page_tabs
  add column tab_color text;

alter table public.links add constraint links_comment_word_limit
  check (comment_text = '' or array_length(regexp_split_to_array(btrim(comment_text), '[[:space:]]+'), 1) <= 500);
alter table public.page_tabs add constraint page_tabs_tab_color_format
  check (tab_color is null or tab_color ~ '^#[0-9A-Fa-f]{6}$');

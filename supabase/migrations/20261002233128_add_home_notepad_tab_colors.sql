alter table public.pages
  add column home_tab_color text,
  add column notepad_tab_color text;

alter table public.pages add constraint pages_home_tab_color_format
  check (home_tab_color is null or home_tab_color ~ '^#[0-9A-Fa-f]{6}$');
alter table public.pages add constraint pages_notepad_tab_color_format
  check (notepad_tab_color is null or notepad_tab_color ~ '^#[0-9A-Fa-f]{6}$');

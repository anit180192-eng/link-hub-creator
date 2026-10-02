export type LinkComment = {
  id: string;
  link_id: string;
  body: string;
  author_kind: string;
  created_at: string;
};

export const commentWordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

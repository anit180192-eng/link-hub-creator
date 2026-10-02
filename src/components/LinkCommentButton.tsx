import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { commentWordCount, type LinkComment } from "@/lib/link-comments";

export function LinkCommentButton({ linkId, linkName, ownerNote, comments, onSubmit, onDelete }: {
  linkId: string;
  linkName: string;
  ownerNote?: string | undefined;
  comments: LinkComment[];
  onSubmit: (body: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const words = commentWordCount(body);
  const count = comments.length + (ownerNote?.trim() ? 1 : 0);
  const submit = async () => {
    if (!words || words > 500 || pending) return;
    setPending(true);
    setError("");
    try {
      await onSubmit(body.trim());
      setBody("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add comment. Try again.");
    } finally {
      setPending(false);
    }
  };
  return <Dialog>
    <DialogTrigger asChild>
      <button type="button" onClick={(event) => event.stopPropagation()} aria-label={`Comments for ${linkName}`} title={`Comments for ${linkName}`} className="inline-flex shrink-0 items-center gap-0.5 rounded p-1 text-hub-muted hover:text-hub-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
        <MessageCircle className="size-4" aria-hidden="true" />
        {count ? <span className="text-[10px] tabular-nums">{count}</span> : null}
      </button>
    </DialogTrigger>
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Comments for {linkName}</DialogTitle><DialogDescription>Comments are visible to everyone who can view this page.</DialogDescription></DialogHeader>
      <div className="max-h-56 space-y-3 overflow-y-auto" aria-live="polite">
        {ownerNote?.trim() ? <div className="rounded border p-3 text-sm"><p className="mb-1 text-xs font-semibold text-muted-foreground">Page owner</p><p className="whitespace-pre-wrap break-words">{ownerNote}</p></div> : null}
        {comments.map((comment) => <div key={comment.id} className="rounded border p-3 text-sm">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{comment.author_kind === "owner" ? "Page owner" : "Visitor"} · {comment.created_at.slice(0, 10)}</span>{onDelete ? <button type="button" className="underline" onClick={async () => { try { await onDelete(comment.id); } catch { setError("Could not remove comment."); } }}>Remove</button> : null}</div>
          <p className="whitespace-pre-wrap break-words">{comment.body}</p>
        </div>)}
        {!count ? <p className="text-sm text-muted-foreground">No comments yet.</p> : null}
      </div>
      <div className="space-y-2"><label htmlFor={`comment-${linkId}`} className="text-sm font-medium">Add a comment</label><textarea id={`comment-${linkId}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={10000} className="min-h-28 w-full rounded border bg-background p-3 text-sm" placeholder="Write a comment…" /><p className="text-right text-xs text-muted-foreground">{words} / 500 words</p></div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <Button type="button" disabled={!words || words > 500 || pending} onClick={() => void submit()}>{pending ? "Adding…" : "Add comment"}</Button>
    </DialogContent>
  </Dialog>;
}

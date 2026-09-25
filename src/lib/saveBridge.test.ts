import { describe, expect, it } from "vitest";
import { parseSaveCurrent } from "./saveBridge";

const ok = { sourceIsWindow: true, origin: "https://a.test", expectedOrigin: "https://a.test" };
const msg = (o: Record<string, unknown> = {}) => ({ type: "LPB_SAVE_CURRENT", version: 1, url: "https://music.example.com/x", title: "Music", ...o });

describe("parseSaveCurrent", () => {
  it("accepts a valid message", () => {
    expect(parseSaveCurrent(msg(), ok)).toEqual({ url: "https://music.example.com/x", title: "Music" });
  });
  it("rejects other source/origin/version/type", () => {
    expect(parseSaveCurrent(msg(), { ...ok, sourceIsWindow: false })).toBeNull();
    expect(parseSaveCurrent(msg(), { ...ok, origin: "https://evil.test" })).toBeNull();
    expect(parseSaveCurrent(msg({ version: 2 }), ok)).toBeNull();
    expect(parseSaveCurrent(msg({ type: "LPB_BOOKMARKS" }), ok)).toBeNull();
  });
  it("rejects unsafe URLs", () => {
    for (const url of ["javascript:alert(1)", "file:///etc", "https://u:p@x.com", "notaurl", `https://x.com/${"a".repeat(600)}`])
      expect(parseSaveCurrent(msg({ url }), ok)).toBeNull();
  });
  it("trims and bounds the title", () => {
    expect(parseSaveCurrent(msg({ title: "  a\n b " + "x".repeat(100) }), ok)!.title.length).toBe(60);
    expect(parseSaveCurrent(msg({ title: 5 }), ok)!.title).toBe("");
  });
});

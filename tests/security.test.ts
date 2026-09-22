import { beforeEach, describe, expect, mock, test } from "bun:test";
import { isStrongPin } from "../src/lib/pin-validation";
import { secureResponse } from "../src/lib/response-security";

describe("security boundaries", () => {
  test("rejects weak and malformed PINs on the shared validation path", () => {
    for (const value of ["123456", "654321", "000000", "111111", "12345", "1234567", "abcdef", "12345\n", "839201\n"]) {
      expect(isStrongPin(value)).toBe(false);
    }
    expect(isStrongPin("839201")).toBe(true);
    expect(isStrongPin("083921")).toBe(true);
  });

  test("private responses override shared cache directives and preserve cookies/body", async () => {
    const response = secureResponse(new Response("private links", {
      headers: { "cache-control": "public, max-age=3600", "set-cookie": "unlock=token; HttpOnly; Secure", "vary": "Origin" },
    }));
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("cdn-cache-control")).toBe("no-store");
    expect(response.headers.get("cloudflare-cdn-cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("vary")).toBe("Origin");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.text()).toBe("private links");
  });
});

// Exercise the actual unlock handler without making network requests or issuing cookies.
const events: string[] = [];
let reservation: any;
let tokenError: any;
let hashMatches: boolean;
let pageRecord: any;
let pageError: any;
let unlockedDevice: any;
let linksRead = 0;
const privateLinks = [{ id: "link", url: "https://example.com/private" }];
const admin = {
  rpc: async () => { events.push("reserve"); return reservation; },
  from: (table: string) => {
    const chain: any = {
      select: () => chain, eq: () => chain,
      maybeSingle: async () => table === "pages"
        ? { data: pageRecord, error: pageError }
        : { data: { pin_hash: "hash", pin_salt: "salt" } },
      order: async () => { linksRead++; return { data: privateLinks }; },
      update: () => chain,
      insert: async () => { events.push("token"); return { error: tokenError }; },
      delete: () => { events.push("clear-attempt"); return chain; },
    };
    return chain;
  },
};
mock.module("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (input: unknown) => input;
    const builder: any = {
      inputValidator: (fn: typeof validate) => { validate = fn; return builder; },
      handler: (fn: any) => ({ data }: any) => fn({ data: validate(data) }),
    };
    return builder;
  },
}));
mock.module("../src/lib/pin.server", () => ({
  getAdmin: async () => admin,
  findUnlockedDevice: async (ownerId: string) => {
    expect(ownerId).toBe("owner");
    return unlockedDevice;
  },
  visitorFingerprint: async () => "a".repeat(64),
  hashPin: async () => { events.push("hash"); return "hash"; },
  safeEqual: () => hashMatches,
  randomHex: () => "b".repeat(64), sha256: async () => "c".repeat(64),
  describeBrowser: () => "Test browser", LOCKOUT_MINUTES: 15, VISIT_HOURS: 12,
  writeVisitCookie: () => { events.push("cookie"); },
}));
mock.module("@supabase/supabase-js", () => ({ createClient: () => admin }));
const { unlockPage, getPublicPage } = await import("../src/lib/public-page.functions");

beforeEach(() => {
  events.length = 0;
  reservation = { data: [{ allowed: true, attempt_id: "attempt", remaining: 4 }], error: null };
  tokenError = null;
  hashMatches = true;
  pageRecord = {
    id: "page", user_id: "owner", slug: "test-page", pin_protected: true,
    display_name: "Private Owner", tagline: "Private tagline", avatar_url: "https://example.com/private-photo",
    theme: "teal", dark_mode: true, clocks: [],
  };
  pageError = null;
  unlockedDevice = null;
  linksRead = 0;
});
const unlock = () => unlockPage({ data: { slug: "test-page", pin: "839201" } });

test("a lockout prevents hashing or creating a device", async () => {
  reservation.data[0].allowed = false;
  expect(await unlock()).toMatchObject({ ok: false, reason: "locked_out" });
  expect(events).toEqual(["reserve"]);
});
test("rate-limit errors fail closed", async () => {
  reservation = { data: null, error: { message: "unavailable" } };
  await expect(unlock()).rejects.toThrow("PIN check unavailable");
  expect(events).toEqual(["reserve"]);
});
test("a wrong PIN consumes its reservation without creating a cookie", async () => {
  hashMatches = false;
  expect(await unlock()).toEqual({ ok: false, reason: "wrong_pin", remaining: 4 });
  expect(events).toEqual(["reserve", "hash"]);
});
test("device persistence errors never issue an unlock cookie", async () => {
  tokenError = { message: "unavailable" };
  await expect(unlock()).rejects.toThrow("Couldn't unlock this browser");
  expect(events).toEqual(["reserve", "hash", "token"]);
});
test("successful unlock reserves before hashing and issues cookie after persistence", async () => {
  expect(await unlock()).toEqual({ ok: true });
  expect(events).toEqual(["reserve", "hash", "token", "clear-attempt", "cookie"]);
});

test("locked pages serialize no profile metadata or links", async () => {
  const result = await getPublicPage({ data: "test-page" });
  expect(result).toEqual({ profile: null, links: [], locked: true, protected: true, trusted: false });
  expect(linksRead).toBe(0);
  expect(JSON.stringify(result)).not.toContain("Private Owner");
  expect(JSON.stringify(result)).not.toContain("private-photo");
});
test.each(["session", "trusted"])("a valid %s unlock returns the profile and links", async (kind) => {
  unlockedDevice = { id: "device", kind };
  const result = await getPublicPage({ data: "test-page" });
  expect(result).toMatchObject({ locked: false, profile: { display_name: "Private Owner" }, links: privateLinks, trusted: kind === "trusted" });
  expect(linksRead).toBe(1);
});
test("unprotected pages remain readable", async () => {
  pageRecord.pin_protected = false;
  const result = await getPublicPage({ data: "test-page" });
  expect(result).toMatchObject({ locked: false, protected: false, profile: { display_name: "Private Owner" }, links: privateLinks });
});
test("missing and failed page lookups do not return metadata", async () => {
  pageRecord = null;
  expect(await getPublicPage({ data: "missing" })).toBeNull();
  pageError = { message: "unavailable" };
  await expect(getPublicPage({ data: "test-page" })).rejects.toThrow("couldn't be loaded");
  expect(linksRead).toBe(0);
});

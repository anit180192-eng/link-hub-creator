const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function toHtml(nodes) {
  return "<DL>" + nodes.map((n) => n.url
    ? `<DT><A HREF="${esc(n.url)}">${esc(n.title || n.url)}</A>`
    : `<DT><H3${n.id === "1" ? ' PERSONAL_TOOLBAR_FOLDER="true"' : ""}>${esc(n.title || "Folder")}</H3>${toHtml(n.children || [])}`).join("") + "</DL>";
}
document.getElementById("go").onclick = async () => {
  const s = document.getElementById("s");
  s.textContent = "Sending…";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) { s.textContent = "Open your Landing Page Builder dashboard first."; return; }
    const tree = await chrome.bookmarks.getTree();
    const html = toHtml(tree[0].children || []);
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, world: "MAIN", args: [html],
      func: (h) => new Promise((resolve) => {
        if (!/\/dashboard/.test(location.pathname)) return resolve(null);
        let ready = false;
        const done = (m) => { clearTimeout(p); clearTimeout(t); removeEventListener("message", on); resolve(m); };
        const p = setTimeout(() => { if (!ready) done("This builder page doesn't support the extension yet. Publish the latest version of the site (or use the preview), reload the dashboard, and try again."); }, 4000);
        const t = setTimeout(() => done("The builder didn't finish in time. Reload the dashboard and check if the tab was created."), 90000);
        function on(e) {
          if (e.source !== window || !e.data) return;
          if (e.data.type === "LPB_PONG" && !ready) { ready = true; postMessage({ type: "LPB_BOOKMARKS", html: h }, location.origin); }
          if (e.data.type === "LPB_BOOKMARKS_RESULT") done(e.data.msg);
        }
        addEventListener("message", on);
        postMessage({ type: "LPB_PING" }, location.origin);
      }) });
    const msg = results.map((r) => r.result).find(Boolean);
    s.textContent = msg ? (msg.startsWith("OK: ") ? "Done! " + msg.slice(4) : msg) : "Open your Landing Page Builder dashboard (signed in) in this tab first.";
  } catch (e) { s.textContent = "Couldn't send: " + e.message; }
};
